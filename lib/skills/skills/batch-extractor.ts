/**
 * Batch Extractor Skill
 *
 * Extracts structured data from multiple invoices, haul logs, and other
 * waste management documents using Claude Vision API.
 *
 * Supports:
 * - PDF, PNG, JPG, JPEG files (via Claude Vision)
 * - Excel files (direct parsing)
 * - CSV files (direct parsing)
 *
 * Features:
 * - Batch processing of multiple files
 * - Progress tracking per file
 * - Graceful error handling (continues on file failures)
 * - Data validation and normalization
 * - AI usage tracking
 */

import { BaseSkill } from "../base-skill";
import type {
  SkillContext,
  ValidationResult,
  BatchExtractorResult,
  InvoiceData,
  HaulLogEntry,
  ProcessingDetail,
} from "../types";
import {
  extractInvoiceWithVision,
  extractHaulLogWithVision,
  detectDocumentType,
  calculateAnthropicCost,
} from "@/lib/ai/vision-extractor";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability/logger";
import { metrics } from "@/lib/observability/metrics";
import { SkillExecutionError, ValidationError } from "@/lib/types/errors";
import {
  InvoiceRepository,
  HaulLogRepository,
  type InvoiceRecord,
  type HaulLogRecord,
  type InvoiceCharges,
} from "@/lib/db";
import ExcelJS from "exceljs";
import Papa from "papaparse";

/**
 * Container type validation
 */
const VALID_CONTAINER_TYPES = [
  "COMPACTOR",
  "DUMPSTER",
  "OPEN_TOP",
  "OTHER",
] as const;
const VALID_SERVICE_TYPES = [
  "PICKUP",
  "DELIVERY",
  "EXCHANGE",
  "OTHER",
] as const;

export class BatchExtractorSkill extends BaseSkill<BatchExtractorResult> {
  readonly name = "batch-extractor";
  readonly version = "1.0.0";
  readonly description =
    "Extracts structured data from waste management documents using Claude Vision API";

  /**
   * Validate that we have files to process
   */
  async validate(context: SkillContext): Promise<ValidationResult> {
    const validationLogger = logger.child({
      skillName: this.name,
      projectId: context.projectId,
    });

    validationLogger.debug("Starting validation");

    const errors: Array<{ field: string; message: string; code: string }> = [];

    // Get files from database
    const supabase = await createClient();
    const { data: files, error: filesError } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", context.projectId);

    if (filesError) {
      errors.push({
        field: "project_files",
        message: `Failed to fetch project files: ${filesError.message}`,
        code: "DATABASE_ERROR",
      });
    } else if (!files || files.length === 0) {
      errors.push({
        field: "project_files",
        message:
          "No files found for this project. Upload files before running extraction.",
        code: "NO_FILES",
      });
    }

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      errors.push({
        field: "anthropic_api_key",
        message: "ANTHROPIC_API_KEY environment variable is not set",
        code: "MISSING_API_KEY",
      });
    }

    if (errors.length > 0) {
      validationLogger.warn("Validation failed", { errors });
      return { valid: false, errors };
    }

    validationLogger.debug("Validation passed", { fileCount: files?.length });
    return { valid: true };
  }

  /**
   * Execute batch extraction
   */
  protected async executeInternal(
    context: SkillContext,
  ): Promise<BatchExtractorResult> {
    const executionLogger = logger.child({
      skillName: this.name,
      projectId: context.projectId,
    });

    executionLogger.info("Starting batch extraction");

    // Initialize result containers
    const invoices: InvoiceData[] = [];
    const haulLogs: HaulLogEntry[] = [];
    const processingDetails: ProcessingDetail[] = [];
    let totalRequests = 0;
    let totalTokensInput = 0;
    let totalTokensOutput = 0;

    // Get files from database
    await this.updateProgress(context, {
      percent: 5,
      step: "Fetching project files",
    });

    const supabase = await createClient();
    const { data: files, error: filesError } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", context.projectId);

    if (filesError || !files || files.length === 0) {
      throw new SkillExecutionError(
        this.name,
        "NO_FILES",
        "No files found to process",
      );
    }

    executionLogger.info("Files retrieved", { fileCount: files.length });

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const percentComplete = Math.round(((i + 1) / files.length) * 85) + 10; // 10-95%

      this.checkCancellation(context);

      await this.updateProgress(context, {
        percent: percentComplete,
        step: `Processing file ${i + 1}/${files.length}: ${file.file_name}`,
        stepNumber: i + 1,
        totalSteps: files.length,
      });

      try {
        executionLogger.debug("Processing file", {
          fileId: file.id,
          fileName: file.file_name,
          fileType: file.file_type,
          mimeType: file.mime_type,
        });

        // Download file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("project-files")
          .download(file.storage_path);

        if (downloadError || !fileData) {
          throw new Error(`Failed to download file: ${downloadError?.message}`);
        }

        // Convert Blob to Buffer
        const arrayBuffer = await fileData.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        // Process based on file type
        const processedData = await this.processFile(
          file,
          fileBuffer,
          executionLogger,
        );

        // Add to results
        if (processedData.invoices) {
          invoices.push(...processedData.invoices);
        }
        if (processedData.haulLogs) {
          haulLogs.push(...processedData.haulLogs);
        }

        // Track AI usage
        if (processedData.usage) {
          totalRequests++;
          totalTokensInput += processedData.usage.input_tokens;
          totalTokensOutput += processedData.usage.output_tokens;
        }

        // Record success
        processingDetails.push({
          fileId: file.id,
          fileName: file.file_name,
          fileType: file.file_type,
          status: "success",
          extractedRecords:
            (processedData.invoices?.length || 0) +
            (processedData.haulLogs?.length || 0),
        });

        metrics.increment("batch_extractor.file.success", 1, {
          projectId: context.projectId,
          fileType: file.file_type,
        });

        executionLogger.info("File processed successfully", {
          fileId: file.id,
          invoicesExtracted: processedData.invoices?.length || 0,
          haulLogsExtracted: processedData.haulLogs?.length || 0,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        executionLogger.error(
          `Failed to process file: ${file.file_name}`,
          error as Error,
        );

        processingDetails.push({
          fileId: file.id,
          fileName: file.file_name,
          fileType: file.file_type,
          status: "failed",
          extractedRecords: 0,
          error: errorMessage,
        });

        metrics.increment("batch_extractor.file.failed", 1, {
          projectId: context.projectId,
          fileType: file.file_type,
        });

        // Continue processing other files
      }
    }

    // Validate all extracted data
    await this.updateProgress(context, {
      percent: 95,
      step: "Validating extracted data",
    });

    executionLogger.debug("Validating extracted data");

    const validatedInvoices = invoices
      .map((invoice) => this.validateInvoiceData(invoice, executionLogger))
      .filter((inv): inv is InvoiceData => inv !== null);

    const validatedHaulLogs = haulLogs
      .map((log) => this.validateHaulLogEntry(log, executionLogger))
      .filter((log): log is HaulLogEntry => log !== null);

    // Calculate total cost
    const totalCostUsd = calculateAnthropicCost({
      input_tokens: totalTokensInput,
      output_tokens: totalTokensOutput,
    });

    executionLogger.info("Batch extraction complete", {
      totalFiles: files.length,
      successfulFiles: processingDetails.filter((d) => d.status === "success")
        .length,
      failedFiles: processingDetails.filter((d) => d.status === "failed")
        .length,
      invoicesExtracted: validatedInvoices.length,
      haulLogsExtracted: validatedHaulLogs.length,
      totalCostUsd,
    });

    metrics.record("batch_extractor.ai_cost_usd", totalCostUsd, "usd", {
      projectId: context.projectId,
    });

    // Save extracted data to database
    await this.updateProgress(context, {
      percent: 96,
      step: "Saving extracted data to database",
    });

    await this.saveToDatabase(
      context.projectId,
      validatedInvoices,
      validatedHaulLogs,
      supabase,
      executionLogger,
    );

    await this.updateProgress(context, {
      percent: 100,
      step: "Extraction complete",
    });

    return {
      summary: {
        totalFilesProcessed: files.length,
        invoicesExtracted: validatedInvoices.length,
        haulLogsExtracted: validatedHaulLogs.length,
        failedFiles: processingDetails.filter((d) => d.status === "failed")
          .length,
      },
      invoices: validatedInvoices,
      haulLogs: validatedHaulLogs,
      processingDetails,
      aiUsage: {
        totalRequests,
        totalTokensInput,
        totalTokensOutput,
        totalCostUsd,
      },
    };
  }

  /**
   * Process a single file based on its type
   */
  private async processFile(
    file: any,
    fileBuffer: Buffer,
    executionLogger: any,
  ): Promise<{
    invoices?: InvoiceData[];
    haulLogs?: HaulLogEntry[];
    usage?: { input_tokens: number; output_tokens: number };
  }> {
    const mimeType = file.mime_type || "application/octet-stream";

    // Handle image/PDF files with Vision API
    if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
      return this.processWithVision(
        file,
        fileBuffer,
        mimeType,
        executionLogger,
      );
    }

    // Handle Excel files
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel"
    ) {
      executionLogger.info("Parsing Excel file", {
        fileName: file.file_name,
      });
      return this.processExcelFile(file, fileBuffer, executionLogger);
    }

    // Handle CSV files
    if (mimeType === "text/csv") {
      executionLogger.info("Parsing CSV file", {
        fileName: file.file_name,
      });
      return this.processCSVFile(file, fileBuffer, executionLogger);
    }

    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  /**
   * Process file using Claude Vision API
   */
  private async processWithVision(
    file: any,
    fileBuffer: Buffer,
    mimeType: string,
    executionLogger: any,
  ): Promise<{
    invoices?: InvoiceData[];
    haulLogs?: HaulLogEntry[];
    usage?: { input_tokens: number; output_tokens: number };
  }> {
    // Detect document type
    const docType = detectDocumentType(file.file_name);

    executionLogger.debug("Processing with Vision API", {
      fileName: file.file_name,
      detectedType: docType,
    });

    if (docType === "invoice") {
      const result = await extractInvoiceWithVision(
        fileBuffer,
        mimeType,
        file.file_name,
      );
      return {
        invoices: [result.invoice],
        usage: result.usage,
      };
    } else if (docType === "haul-log") {
      const result = await extractHaulLogWithVision(
        fileBuffer,
        mimeType,
        file.file_name,
      );
      return {
        haulLogs: result.haulLogs,
        usage: result.usage,
      };
    } else {
      // Default to invoice extraction if type is unknown
      executionLogger.warn(
        "Unknown document type, defaulting to invoice extraction",
        {
          fileName: file.file_name,
        },
      );
      const result = await extractInvoiceWithVision(
        fileBuffer,
        mimeType,
        file.file_name,
      );
      return {
        invoices: [result.invoice],
        usage: result.usage,
      };
    }
  }

  /**
   * Validate invoice data
   */
  private validateInvoiceData(
    invoice: InvoiceData,
    executionLogger: any,
  ): InvoiceData | null {
    try {
      // Required fields
      if (!invoice.propertyName) {
        throw new Error("Missing property name");
      }

      if (!invoice.vendorName) {
        throw new Error("Missing vendor name");
      }

      if (!invoice.lineItems || invoice.lineItems.length === 0) {
        throw new Error("No line items found");
      }

      // Validate container types
      for (const item of invoice.lineItems) {
        if (!VALID_CONTAINER_TYPES.includes(item.containerType)) {
          executionLogger.warn("Invalid container type, defaulting to OTHER", {
            original: item.containerType,
            fileName: invoice.sourceFile,
          });
          item.containerType = "OTHER";
        }
      }

      // Validate totals (warn if mismatch, don't fail)
      const calculatedSubtotal = invoice.lineItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      );

      if (Math.abs(calculatedSubtotal - invoice.subtotal) > 0.01) {
        executionLogger.warn("Subtotal mismatch", {
          calculated: calculatedSubtotal,
          extracted: invoice.subtotal,
          fileName: invoice.sourceFile,
        });
      }

      return invoice;
    } catch (error) {
      executionLogger.error(
        `Invoice validation failed: ${invoice.sourceFile}`,
        error as Error,
      );
      return null;
    }
  }

  /**
   * Validate haul log entry
   */
  private validateHaulLogEntry(
    log: HaulLogEntry,
    executionLogger: any,
  ): HaulLogEntry | null {
    try {
      // Required fields
      if (!log.date) {
        throw new Error("Missing date");
      }

      // Validate container type
      if (!VALID_CONTAINER_TYPES.includes(log.containerType)) {
        executionLogger.warn("Invalid container type, defaulting to OTHER", {
          original: log.containerType,
          fileName: log.sourceFile,
        });
        log.containerType = "OTHER";
      }

      // Validate service type
      if (!VALID_SERVICE_TYPES.includes(log.serviceType)) {
        executionLogger.warn("Invalid service type, defaulting to OTHER", {
          original: log.serviceType,
          fileName: log.sourceFile,
        });
        log.serviceType = "OTHER";
      }

      // Ensure at least weight or volume is present
      if (!log.weight && !log.volume) {
        executionLogger.warn("Missing both weight and volume", {
          fileName: log.sourceFile,
        });
      }

      return log;
    } catch (error) {
      executionLogger.error(
        `Haul log validation failed: ${log.sourceFile}`,
        error as Error,
      );
      return null;
    }
  }

  /**
   * Save extracted data to database
   *
   * Uses repository pattern for type-safe database operations.
   * Gracefully handles failures (logs but doesn't crash).
   */
  private async saveToDatabase(
    projectId: string,
    invoices: InvoiceData[],
    haulLogs: HaulLogEntry[],
    supabase: any,
    executionLogger: any,
  ): Promise<void> {
    executionLogger.info("Saving extracted data to database", {
      invoiceCount: invoices.length,
      haulLogCount: haulLogs.length,
    });

    try {
      // Initialize repositories with Supabase client
      const invoiceRepo = new InvoiceRepository(supabase);
      const haulLogRepo = new HaulLogRepository(supabase);

      // Convert and save invoices
      if (invoices.length > 0) {
        const invoiceRecords: InvoiceRecord[] = invoices.map((inv) => {
          // Extract charges from line items by categorizing descriptions
          const charges: InvoiceCharges = {
            disposal: 0,
            pickup_fees: 0,
            rental: 0,
            contamination: 0,
            bulk_service: 0,
            other: 0,
          };

          let totalTonnage = 0;
          let totalHauls = 0;

          // Parse line items to extract charges and metrics
          inv.lineItems.forEach((item) => {
            const desc = item.description.toLowerCase();

            // Categorize charges by description keywords
            if (
              desc.includes("disposal") ||
              desc.includes("landfill") ||
              desc.includes("dump")
            ) {
              charges.disposal! += item.totalPrice;
            } else if (
              desc.includes("pickup") ||
              desc.includes("haul") ||
              desc.includes("collection")
            ) {
              charges.pickup_fees! += item.totalPrice;
            } else if (desc.includes("rental") || desc.includes("lease")) {
              charges.rental! += item.totalPrice;
            } else if (
              desc.includes("contamination") ||
              desc.includes("contam")
            ) {
              charges.contamination! += item.totalPrice;
            } else if (
              desc.includes("bulk") ||
              desc.includes("on-call") ||
              desc.includes("extra")
            ) {
              charges.bulk_service! += item.totalPrice;
            } else {
              charges.other! += item.totalPrice;
            }

            // Extract tonnage and hauls from line items
            // Tonnage: look for weight-based items (compactor services)
            if (
              desc.includes("ton") ||
              desc.includes("weight") ||
              item.containerType === "COMPACTOR"
            ) {
              // For compactors, quantity often represents tons
              if (item.quantity && item.quantity < 50) {
                // Sanity check (50 tons per line item max)
                totalTonnage += item.quantity;
              }
            }

            // Hauls: count pickup/service events
            if (
              desc.includes("haul") ||
              desc.includes("pickup") ||
              desc.includes("service")
            ) {
              totalHauls += item.quantity || 1; // Default to 1 if quantity not specified
            }
          });

          return {
            project_id: projectId,
            invoice_number: inv.invoiceNumber,
            invoice_date: inv.billingDate, // Use billingDate from InvoiceData
            vendor_name: inv.vendorName,
            service_type:
              inv.servicePeriodStart && inv.servicePeriodEnd
                ? `${inv.servicePeriodStart} to ${inv.servicePeriodEnd}`
                : undefined,
            total_amount: inv.total, // Use total from InvoiceData
            tonnage: totalTonnage > 0 ? totalTonnage : undefined,
            hauls: totalHauls > 0 ? totalHauls : undefined,
            charges,
            notes: inv.vendorContact || undefined,
          };
        });

        const invoiceResult = await invoiceRepo.batchInsert(invoiceRecords);

        executionLogger.info("Invoices saved to database", {
          inserted: invoiceResult.inserted,
          failed: invoiceResult.failed,
        });

        if (invoiceResult.failed > 0) {
          executionLogger.warn("Some invoices failed to save", {
            failed: invoiceResult.failed,
            errors: invoiceResult.errors.slice(0, 3), // Log first 3 errors
          });
        }

        metrics.increment(
          "batch_extractor.db.invoices_saved",
          invoiceResult.inserted,
          {
            projectId,
          },
        );
      }

      // Convert and save haul logs (compactor projects only)
      if (haulLogs.length > 0) {
        const haulLogRecords: HaulLogRecord[] = haulLogs.map((log) => ({
          project_id: projectId,
          haul_date: log.date, // Use date from HaulLogEntry
          tonnage: log.weight || 0, // Use weight as tonnage
          status: log.weight && log.weight < 6.0 ? "low_utilization" : "normal",
        }));

        const haulLogResult = await haulLogRepo.batchInsert(haulLogRecords);

        executionLogger.info("Haul logs saved to database", {
          inserted: haulLogResult.inserted,
          failed: haulLogResult.failed,
        });

        if (haulLogResult.failed > 0) {
          executionLogger.warn("Some haul logs failed to save", {
            failed: haulLogResult.failed,
            errors: haulLogResult.errors.slice(0, 3), // Log first 3 errors
          });
        }

        metrics.increment(
          "batch_extractor.db.haul_logs_saved",
          haulLogResult.inserted,
          {
            projectId,
          },
        );
      }

      executionLogger.info("Database save completed successfully");
    } catch (error) {
      // Log error but don't fail the entire extraction
      executionLogger.error("Failed to save data to database", error as Error, {
        projectId,
        invoiceCount: invoices.length,
        haulLogCount: haulLogs.length,
      });

      metrics.increment("batch_extractor.db.save_failed", 1, {
        projectId,
      });

      // Don't throw - we want to return extracted data even if DB save fails
    }
  }

  /**
   * Process Excel file (.xlsx, .xls)
   * Extracts tabular data and sends to Claude for structured extraction
   */
  private async processExcelFile(
    file: any,
    fileBuffer: Buffer,
    executionLogger: any,
  ): Promise<{
    invoices?: InvoiceData[];
    haulLogs?: HaulLogEntry[];
    usage?: { input_tokens: number; output_tokens: number };
  }> {
    try {
      // Validate file size (max 10MB for spreadsheets)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (fileBuffer.length > MAX_FILE_SIZE) {
        throw new Error(
          `Excel file too large: ${Math.round(fileBuffer.length / 1024 / 1024)}MB (max 10MB)`,
        );
      }

      executionLogger.info("Parsing Excel file", {
        fileName: file.file_name,
        sizeBytes: fileBuffer.length,
      });

      // Load workbook
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer as any);

      // Find first non-empty worksheet
      let targetWorksheet: ExcelJS.Worksheet | null = null;
      for (const worksheet of workbook.worksheets) {
        if (worksheet.rowCount > 0) {
          targetWorksheet = worksheet;
          break;
        }
      }

      if (!targetWorksheet) {
        throw new Error("No data found in Excel file (all sheets are empty)");
      }

      executionLogger.debug("Processing worksheet", {
        sheetName: targetWorksheet.name,
        rowCount: targetWorksheet.rowCount,
        columnCount: targetWorksheet.columnCount,
      });

      // Extract data from worksheet
      const rows: any[][] = [];
      const MAX_ROWS = 100; // Limit to first 100 rows to control token usage
      let rowsProcessed = 0;

      targetWorksheet.eachRow((row, rowNumber) => {
        if (rowsProcessed >= MAX_ROWS) {
          return;
        }

        // Convert row to array of values, handling various cell types
        const rowValues: any[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          // Sanitize cell values (remove formulas for security)
          if (cell.type === ExcelJS.ValueType.Formula) {
            rowValues.push(cell.result?.toString() || "");
          } else {
            rowValues.push(cell.value?.toString() || "");
          }
        });

        rows.push(rowValues);
        rowsProcessed++;
      });

      if (rows.length === 0) {
        throw new Error("No data rows found in Excel file");
      }

      // Format data for LLM extraction
      const formattedData = this.formatTableDataForLLM(rows, file.file_name);

      if (rows.length >= MAX_ROWS) {
        executionLogger.warn("Excel file truncated to control token usage", {
          fileName: file.file_name,
          totalRows: targetWorksheet.rowCount,
          processedRows: rows.length,
        });
      }

      // Send to Claude for structured extraction
      return this.extractStructuredDataWithClaude(
        formattedData,
        file.file_name,
        executionLogger,
      );
    } catch (error) {
      executionLogger.error("Excel parsing failed", error as Error, {
        fileName: file.file_name,
      });
      throw new Error(
        `Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Process CSV file
   * Extracts tabular data and sends to Claude for structured extraction
   */
  private async processCSVFile(
    file: any,
    fileBuffer: Buffer,
    executionLogger: any,
  ): Promise<{
    invoices?: InvoiceData[];
    haulLogs?: HaulLogEntry[];
    usage?: { input_tokens: number; output_tokens: number };
  }> {
    try {
      // Validate file size (max 10MB for CSVs)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (fileBuffer.length > MAX_FILE_SIZE) {
        throw new Error(
          `CSV file too large: ${Math.round(fileBuffer.length / 1024 / 1024)}MB (max 10MB)`,
        );
      }

      executionLogger.info("Parsing CSV file", {
        fileName: file.file_name,
        sizeBytes: fileBuffer.length,
      });

      // Convert buffer to string
      const csvContent = fileBuffer.toString("utf-8");

      // Parse CSV with PapaParse
      const parseResult = Papa.parse<string[]>(csvContent, {
        skipEmptyLines: true,
        header: false, // We'll handle headers manually
        delimiter: "", // Auto-detect delimiter
      });

      if (parseResult.errors.length > 0) {
        executionLogger.warn("CSV parsing errors", {
          fileName: file.file_name,
          errors: parseResult.errors.slice(0, 3), // Log first 3 errors
        });
      }

      const rows = parseResult.data;
      if (rows.length === 0) {
        throw new Error("No data rows found in CSV file");
      }

      // Truncate to first 100 rows to control token usage
      const MAX_ROWS = 100;
      const truncatedRows = rows.slice(0, MAX_ROWS);

      if (rows.length > MAX_ROWS) {
        executionLogger.warn("CSV file truncated to control token usage", {
          fileName: file.file_name,
          totalRows: rows.length,
          processedRows: truncatedRows.length,
        });
      }

      // Format data for LLM extraction
      const formattedData = this.formatTableDataForLLM(
        truncatedRows,
        file.file_name,
      );

      // Send to Claude for structured extraction
      return this.extractStructuredDataWithClaude(
        formattedData,
        file.file_name,
        executionLogger,
      );
    } catch (error) {
      executionLogger.error("CSV parsing failed", error as Error, {
        fileName: file.file_name,
      });
      throw new Error(
        `Failed to parse CSV file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Format tabular data into a concise text format for LLM processing
   */
  private formatTableDataForLLM(rows: any[][], fileName: string): string {
    if (rows.length === 0) {
      return "Empty table";
    }

    const rowCount = rows.length;
    const colCount = Math.max(...rows.map((r) => r.length));

    // Assume first row is header
    const header = rows[0];
    const dataRows = rows.slice(1);

    let formatted = `Spreadsheet: ${fileName}\n`;
    formatted += `Table with ${dataRows.length} data rows and ${colCount} columns\n\n`;
    formatted += `Header: ${header.join(" | ")}\n`;
    formatted += `${"-".repeat(80)}\n`;

    // Add data rows
    dataRows.forEach((row, idx) => {
      formatted += `Row ${idx + 1}: ${row.join(" | ")}\n`;
    });

    return formatted;
  }

  /**
   * Extract structured data using Claude from formatted table text
   */
  private async extractStructuredDataWithClaude(
    formattedData: string,
    fileName: string,
    executionLogger: any,
  ): Promise<{
    invoices?: InvoiceData[];
    haulLogs?: HaulLogEntry[];
    usage?: { input_tokens: number; output_tokens: number };
  }> {
    // Detect document type from filename
    const docType = detectDocumentType(fileName);

    executionLogger.debug("Extracting structured data with Claude", {
      fileName,
      detectedType: docType,
      dataLength: formattedData.length,
    });

    // Use Anthropic SDK to extract structured data
    const anthropic = new (await import("@anthropic-ai/sdk")).default({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt =
      docType === "haul-log"
        ? `Extract waste haul log data from this spreadsheet. Return JSON array with fields:
- date (YYYY-MM-DD)
- time (HH:MM, optional)
- container_type (COMPACTOR, DUMPSTER, OPEN_TOP, or OTHER)
- tons (number)
- location (string, optional)
- notes (string, optional)

Return only valid JSON array, no markdown.`
        : `Extract invoice data from this spreadsheet. Return JSON object with fields:
- invoice_number (string)
- invoice_date (YYYY-MM-DD)
- service_period_start (YYYY-MM-DD, optional)
- service_period_end (YYYY-MM-DD, optional)
- vendor_name (string)
- total_amount (number)
- service_type (string, e.g. "Waste Collection")
- charges (array of {description, amount, quantity, unit_price})

Return only valid JSON object, no markdown.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: formattedData,
        },
      ],
    });

    // Extract JSON from response
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    let extractedText = textContent.text.trim();
    // Remove markdown code blocks if present
    extractedText = extractedText
      .replace(/^```json\n?/i, "")
      .replace(/\n?```$/i, "");

    const usage = {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    };

    try {
      if (docType === "haul-log") {
        const haulLogs = JSON.parse(extractedText) as HaulLogEntry[];
        executionLogger.info("Extracted haul logs from spreadsheet", {
          fileName,
          count: haulLogs.length,
        });
        return { haulLogs, usage };
      } else {
        const invoice = JSON.parse(extractedText) as InvoiceData;
        executionLogger.info("Extracted invoice from spreadsheet", {
          fileName,
          invoiceNumber: invoice.invoiceNumber,
        });
        return { invoices: [invoice], usage };
      }
    } catch (error) {
      executionLogger.error(
        "Failed to parse Claude response as JSON",
        error as Error,
        {
          fileName,
          response: extractedText.substring(0, 200),
        },
      );
      throw new Error("Failed to parse extracted data as JSON");
    }
  }
}
