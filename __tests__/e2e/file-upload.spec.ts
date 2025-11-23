/**
 * E2E Test Suite: File Upload & Validation
 *
 * Tests all file upload functionality including:
 * - PDF/Excel/CSV uploads
 * - Multiple file uploads
 * - File size validation
 * - File type validation
 * - Upload progress indicators
 * - File management (removal before analysis)
 */

import { test, expect } from "./utils/fixtures";
import { uploadFileViaUI, verifyFileInStorage } from "./utils/test-helpers";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

test.describe("File Upload & Validation", () => {
  test.describe("Supported File Types", () => {
    test("User can upload PDF invoice", async ({ testProject }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Create a temporary PDF file for testing
      const testPdfPath = path.join(os.tmpdir(), "test-invoice.pdf");
      fs.writeFileSync(testPdfPath, "PDF test content"); // Minimal PDF

      try {
        // Upload PDF
        await uploadFileViaUI(page, testPdfPath);

        // Wait for upload success
        await expect(
          page.locator("text=/uploaded|upload.*success/i"),
        ).toBeVisible({ timeout: 10000 });

        // Verify file appears in file list
        await expect(page.locator("text=/test-invoice\.pdf/i")).toBeVisible();
      } finally {
        // Cleanup temp file
        if (fs.existsSync(testPdfPath)) {
          fs.unlinkSync(testPdfPath);
        }
      }
    });

    test("User can upload Excel invoice (.xlsx)", async ({ testProject }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Use existing test file
      const excelPath = path.join(
        __dirname,
        "seeds/test-files/sample-invoice.xlsx",
      );

      // Upload Excel file
      await uploadFileViaUI(page, excelPath);

      // Wait for upload success
      await expect(
        page.locator("text=/uploaded|upload.*success/i"),
      ).toBeVisible({ timeout: 10000 });

      // Verify file appears in file list
      await expect(page.locator("text=/sample-invoice/i")).toBeVisible();
    });

    test("User can upload CSV invoice", async ({ testProject }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Create temporary CSV file
      const csvPath = path.join(os.tmpdir(), "test-invoice.csv");
      const csvContent =
        "Date,Description,Amount\n2025-01-01,Waste Service,1500.00\n";
      fs.writeFileSync(csvPath, csvContent);

      try {
        // Upload CSV
        await uploadFileViaUI(page, csvPath);

        // Wait for upload success
        await expect(
          page.locator("text=/uploaded|upload.*success/i"),
        ).toBeVisible({ timeout: 10000 });

        // Verify file appears
        await expect(page.locator("text=/test-invoice\.csv/i")).toBeVisible();
      } finally {
        // Cleanup
        if (fs.existsSync(csvPath)) {
          fs.unlinkSync(csvPath);
        }
      }
    });
  });

  test.describe("Multiple File Upload", () => {
    test("User can upload multiple files at once", async ({ testProject }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Prepare multiple test files
      const invoicePath = path.join(
        __dirname,
        "seeds/test-files/sample-invoice.xlsx",
      );
      const haulLogPath = path.join(
        __dirname,
        "seeds/test-files/sample-haullog.xlsx",
      );

      // Upload multiple files
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([invoicePath, haulLogPath]);

      // Wait for upload success
      await expect(
        page.locator("text=/2.*files?.*uploaded|uploaded.*2.*files?/i"),
      ).toBeVisible({ timeout: 15000 });

      // Verify both files appear in list
      await expect(page.locator("text=/sample-invoice/i")).toBeVisible();
      await expect(page.locator("text=/sample-haullog/i")).toBeVisible();
    });
  });

  test.describe("File Size Validation", () => {
    test("User cannot upload files exceeding size limit (10MB)", async ({
      testProject,
    }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Create a file larger than 10MB
      const largePath = path.join(os.tmpdir(), "large-file.xlsx");
      const largeContent = Buffer.alloc(11 * 1024 * 1024); // 11MB
      fs.writeFileSync(largePath, largeContent);

      try {
        // Attempt to upload
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(largePath);

        // Should show size limit error
        await expect(
          page.locator(
            "text=/file.*too.*large|exceeds.*size.*limit|maximum.*10.*mb/i",
          ),
        ).toBeVisible({ timeout: 10000 });

        // File should NOT appear in list
        await expect(page.locator("text=/large-file/i")).not.toBeVisible();
      } finally {
        // Cleanup
        if (fs.existsSync(largePath)) {
          fs.unlinkSync(largePath);
        }
      }
    });
  });

  test.describe("File Type Validation", () => {
    test("User cannot upload unsupported file types", async ({
      testProject,
    }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Test unsupported file types
      const unsupportedFiles = [
        { name: "malicious.exe", content: "executable content" },
        { name: "archive.zip", content: "zip content" },
        { name: "image.png", content: "png content" },
        { name: "video.mp4", content: "video content" },
      ];

      for (const file of unsupportedFiles) {
        const filePath = path.join(os.tmpdir(), file.name);
        fs.writeFileSync(filePath, file.content);

        try {
          // Attempt upload
          const fileInput = page.locator('input[type="file"]');
          await fileInput.setInputFiles(filePath);

          // Should show unsupported file type error
          await expect(
            page.locator(
              "text=/unsupported.*file.*type|invalid.*file.*type|file.*type.*not.*allowed/i",
            ),
          ).toBeVisible({ timeout: 10000 });

          // File should NOT appear in list
          await expect(page.locator(`text=/${file.name}/i`)).not.toBeVisible();
        } finally {
          // Cleanup
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    });
  });

  test.describe("Upload Progress", () => {
    test("User sees upload progress indicator", async ({ testProject }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Create a moderately sized file to see progress
      const mediumPath = path.join(os.tmpdir(), "medium-file.xlsx");
      const mediumContent = Buffer.alloc(2 * 1024 * 1024); // 2MB
      fs.writeFileSync(mediumPath, mediumContent);

      try {
        // Start upload
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(mediumPath);

        // Progress indicator should appear
        const progressIndicator = page.locator(
          '[data-testid="upload-progress"], .upload-progress, text=/uploading/i',
        );
        await expect(progressIndicator).toBeVisible({ timeout: 5000 });

        // Wait for completion
        await expect(
          page.locator("text=/uploaded|upload.*complete/i"),
        ).toBeVisible({ timeout: 15000 });
      } finally {
        // Cleanup
        if (fs.existsSync(mediumPath)) {
          fs.unlinkSync(mediumPath);
        }
      }
    });
  });

  test.describe("File Management", () => {
    test("User can remove uploaded files before analysis", async ({
      testProject,
    }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Upload a file
      const invoicePath = path.join(
        __dirname,
        "seeds/test-files/sample-invoice.xlsx",
      );
      await uploadFileViaUI(page, invoicePath);

      // Wait for upload
      await expect(page.locator("text=/sample-invoice/i")).toBeVisible({
        timeout: 10000,
      });

      // Click remove button for this file
      const removeButton = page
        .locator('[data-testid="remove-file"], button:has-text("Remove")')
        .first();
      await removeButton.click();

      // File should disappear from list
      await expect(page.locator("text=/sample-invoice/i")).not.toBeVisible({
        timeout: 5000,
      });
    });

    test("User sees file list with names and sizes", async ({
      testProject,
    }) => {
      const { page, projectId } = testProject;

      await page.goto(`/projects/${projectId}`);

      // Upload a file
      const invoicePath = path.join(
        __dirname,
        "seeds/test-files/sample-invoice.xlsx",
      );
      await uploadFileViaUI(page, invoicePath);

      // Wait for upload
      await expect(page.locator("text=/uploaded/i")).toBeVisible({
        timeout: 10000,
      });

      // Verify file list shows file name
      await expect(page.locator("text=/sample-invoice/i")).toBeVisible();

      // Verify file list shows file size
      // Size might be shown in KB or MB
      const fileSizePattern = /\d+\.?\d*\s*(KB|MB|bytes)/i;
      await expect(page.locator(`text=${fileSizePattern}`)).toBeVisible();

      // Verify file type/icon is shown
      const fileTypeIndicator = page.locator(
        '[data-testid="file-type"], .file-type, text=/.xlsx/i',
      );
      await expect(fileTypeIndicator).toBeVisible();
    });
  });
});
