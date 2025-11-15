#!/usr/bin/env python3
"""
Waste Document Extraction Validation Script

This script provides comprehensive validation of extracted waste management data,
including confidence scoring, missing field detection, cross-validation, and
detailed reporting.

Usage:
    python validation_script.py --input extraction_data.json
    python validation_script.py --input extraction_data.json --output report.md --verbose
"""

import json
import argparse
from datetime import datetime
from pathlib import Path


class WasteExtractionValidator:
    """Validates extracted waste management data"""
    
    def __init__(self, confidence_threshold=0.70):
        self.confidence_threshold = confidence_threshold
        self.validation_results = []
        
    def validate_document(self, record):
        """
        Validate a single document extraction
        
        Args:
            record (dict): Extracted document data
            
        Returns:
            dict: Validation report for this document
        """
        
        validation = {
            "source_file": record.get("source_file"),
            "document_type": record.get("document_type"),
            "property_name": record.get("property_name"),
            "confidence_score": 1.0,
            "critical_missing": [],
            "warnings": [],
            "needs_review": False,
            "validation_checks": {}
        }
        
        # Define critical fields by document type
        critical_fields = {
            "invoice": [
                ("property_name", record.get("property_name")),
                ("vendor_name", record.get("vendor_name")),
                ("invoice.invoice_number", self._get_nested(record, "invoice.invoice_number")),
                ("invoice.invoice_date", self._get_nested(record, "invoice.invoice_date")),
                ("invoice.amount_due", self._get_nested(record, "invoice.amount_due"))
            ],
            "contract": [
                ("property_name", record.get("property_name")),
                ("vendor_name", record.get("vendor_name")),
                ("contract.effective_date", self._get_nested(record, "contract.effective_date")),
                ("contract.expiration_date", self._get_nested(record, "contract.expiration_date"))
            ],
            "expense_report": [
                ("property_name", record.get("property_name")),
                ("amount", record.get("amount"))
            ]
        }
        
        # Check critical fields
        doc_type = record.get("document_type")
        if doc_type in critical_fields:
            for field_name, field_value in critical_fields[doc_type]:
                if not field_value or field_value == "" or field_value == "null":
                    validation["critical_missing"].append(field_name)
                    validation["confidence_score"] -= 0.15
        
        # Invoice-specific validations
        if doc_type == "invoice":
            self._validate_invoice(record, validation)
        
        # Contract-specific validations
        if doc_type == "contract":
            self._validate_contract(record, validation)
        
        # Determine if review needed
        validation["needs_review"] = (
            validation["confidence_score"] < self.confidence_threshold or
            len(validation["critical_missing"]) > 0
        )
        
        validation["confidence_score"] = round(max(0, validation["confidence_score"]), 2)
        
        return validation
    
    def _validate_invoice(self, record, validation):
        """Invoice-specific validation checks"""
        
        invoice = record.get("invoice", {})
        
        # Check line items sum to total
        if invoice.get("line_items"):
            try:
                line_total = sum(
                    float(item.get("extended_amount", 0) or 0)
                    for item in invoice["line_items"]
                )
                
                subtotal = float(invoice.get("subtotal", 0) or 0)
                amount_due = float(invoice.get("amount_due", 0) or 0)
                
                # Check if line items match subtotal (more accurate)
                if subtotal > 0:
                    if abs(line_total - subtotal) > 1.0:
                        validation["warnings"].append(
                            f"Line items total (${line_total:.2f}) != Subtotal (${subtotal:.2f})"
                        )
                        validation["confidence_score"] -= 0.10
                    validation["validation_checks"]["line_items_match_subtotal"] = \
                        abs(line_total - subtotal) <= 1.0
                
                # Check if subtotal + fees ≈ amount due
                if subtotal > 0 and amount_due > 0:
                    if subtotal > amount_due:
                        validation["warnings"].append(
                            f"Subtotal (${subtotal:.2f}) > Amount Due (${amount_due:.2f})"
                        )
                        validation["confidence_score"] -= 0.05
                
            except (ValueError, TypeError) as e:
                validation["warnings"].append(f"Error validating totals: {str(e)}")
                validation["confidence_score"] -= 0.10
        
        # Check date consistency
        try:
            invoice_date_str = invoice.get("invoice_date")
            due_date_str = invoice.get("due_date")
            
            if invoice_date_str and due_date_str:
                invoice_date = datetime.fromisoformat(invoice_date_str)
                due_date = datetime.fromisoformat(due_date_str)
                
                if due_date <= invoice_date:
                    validation["warnings"].append(
                        "Due date is not after invoice date"
                    )
                    validation["confidence_score"] -= 0.05
                
                # Check if due date is reasonable (typically 15-60 days)
                days_diff = (due_date - invoice_date).days
                if days_diff > 90:
                    validation["warnings"].append(
                        f"Unusually long payment terms: {days_diff} days"
                    )
                
                validation["validation_checks"]["date_consistency"] = due_date > invoice_date
        except (ValueError, TypeError):
            # Invalid date format
            validation["warnings"].append("Invalid date format detected")
            validation["confidence_score"] -= 0.05
        
        # Check for negative amounts
        try:
            amount_due = float(invoice.get("amount_due", 0) or 0)
            if amount_due < 0:
                validation["warnings"].append("Negative amount due detected")
                validation["confidence_score"] -= 0.10
        except (ValueError, TypeError):
            pass
        
        # Validate line item categories
        valid_categories = [
            "base", "extra_pickup", "contamination", "overage", 
            "fuel_surcharge", "franchise_fee", "admin", "env_charge",
            "rental", "equipment", "other"
        ]
        
        for item in invoice.get("line_items", []):
            category = item.get("category")
            if category and category not in valid_categories:
                validation["warnings"].append(
                    f"Unknown category: {category} in line item"
                )
    
    def _validate_contract(self, record, validation):
        """Contract-specific validation checks"""
        
        contract = record.get("contract", {})
        
        # Check term dates
        try:
            effective_date_str = contract.get("effective_date")
            expiration_date_str = contract.get("expiration_date")
            
            if effective_date_str and expiration_date_str:
                effective_date = datetime.fromisoformat(effective_date_str)
                expiration_date = datetime.fromisoformat(expiration_date_str)
                
                if expiration_date <= effective_date:
                    validation["warnings"].append(
                        "Expiration date is not after effective date"
                    )
                    validation["confidence_score"] -= 0.10
                
                # Calculate term length
                term_years = (expiration_date - effective_date).days / 365.25
                stated_term = contract.get("initial_term_years")
                
                if stated_term and abs(term_years - stated_term) > 0.5:
                    validation["warnings"].append(
                        f"Term calculation mismatch: {term_years:.1f} years vs stated {stated_term} years"
                    )
                
                validation["validation_checks"]["date_consistency"] = expiration_date > effective_date
        except (ValueError, TypeError):
            validation["warnings"].append("Invalid contract date format")
            validation["confidence_score"] -= 0.05
        
        # Check for missing key clauses
        clauses = contract.get("clauses", {})
        important_clauses = ["price_increase", "termination", "renewal"]
        
        missing_clauses = [c for c in important_clauses if not clauses.get(c)]
        if missing_clauses:
            validation["warnings"].append(
                f"Missing important clauses: {', '.join(missing_clauses)}"
            )
            validation["confidence_score"] -= 0.05 * len(missing_clauses)
        
        # Validate service schedules
        schedules = contract.get("service_schedules", [])
        if not schedules:
            validation["warnings"].append("No service schedules found")
            validation["confidence_score"] -= 0.10
    
    def cross_validate_batch(self, all_records):
        """
        Cross-validate records for the same property
        
        Args:
            all_records (list): All extracted records
            
        Returns:
            dict: Cross-validation summary by property
        """
        
        # Group by property
        by_property = {}
        for record in all_records:
            prop = record.get("property_name")
            if prop:
                if prop not in by_property:
                    by_property[prop] = {
                        "records": [],
                        "vendors": set(),
                        "addresses": set()
                    }
                
                by_property[prop]["records"].append(record)
                
                vendor = record.get("vendor_name")
                if vendor:
                    by_property[prop]["vendors"].add(vendor)
                
                address = record.get("property_address")
                if address:
                    by_property[prop]["addresses"].add(address)
        
        # Validate consistency
        cross_validation = {}
        for property_name, data in by_property.items():
            cross_validation[property_name] = {
                "document_count": len(data["records"]),
                "vendors": list(data["vendors"]),
                "vendor_consistent": len(data["vendors"]) <= 1,
                "addresses": list(data["addresses"]),
                "address_consistent": len(data["addresses"]) <= 1,
                "needs_review": len(data["vendors"]) > 1 or len(data["addresses"]) > 1,
                "document_types": {}
            }
            
            # Count document types
            for record in data["records"]:
                doc_type = record.get("document_type", "unknown")
                cross_validation[property_name]["document_types"][doc_type] = \
                    cross_validation[property_name]["document_types"].get(doc_type, 0) + 1
        
        return cross_validation
    
    def generate_report(self, all_validations, cross_validation, output_format="markdown"):
        """
        Generate validation report
        
        Args:
            all_validations (list): Individual validation results
            cross_validation (dict): Cross-validation results
            output_format (str): 'markdown' or 'json'
            
        Returns:
            str: Formatted report
        """
        
        if output_format == "json":
            return json.dumps({
                "validations": all_validations,
                "cross_validation": cross_validation,
                "summary": self._generate_summary(all_validations)
            }, indent=2)
        
        # Markdown report
        report = []
        report.append("# WASTE DOCUMENT EXTRACTION - VALIDATION REPORT")
        report.append(f"\n**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"\n---\n")
        
        # Summary section
        report.append("## EXECUTIVE SUMMARY\n")
        summary = self._generate_summary(all_validations)
        
        report.append(f"- **Total Documents**: {summary['total']}")
        report.append(f"- **Needs Review**: {summary['needs_review']} ({summary['review_percent']:.1f}%)")
        report.append(f"- **Average Confidence**: {summary['avg_confidence']:.2f}")
        report.append(f"- **High Confidence (≥0.85)**: {summary['high_confidence']}")
        report.append(f"- **Medium Confidence (0.70-0.84)**: {summary['medium_confidence']}")
        report.append(f"- **Low Confidence (<0.70)**: {summary['low_confidence']}")
        
        if summary['critical_count'] > 0:
            report.append(f"\n⚠️ **CRITICAL**: {summary['critical_count']} documents have missing critical fields\n")
        
        # Property-level validation
        report.append("\n## PROPERTY-LEVEL VALIDATION\n")
        
        for property_name in sorted(cross_validation.keys()):
            val_data = cross_validation[property_name]
            status = "✅" if not val_data["needs_review"] else "⚠️"
            
            report.append(f"\n### {status} {property_name}\n")
            report.append(f"- **Documents**: {val_data['document_count']}")
            
            doc_types = ", ".join(f"{k}: {v}" for k, v in val_data['document_types'].items())
            report.append(f"- **Types**: {doc_types}")
            
            report.append(f"- **Vendors**: {', '.join(val_data['vendors']) if val_data['vendors'] else 'None'}")
            
            if not val_data["vendor_consistent"]:
                report.append(f"  - ⚠️ **Multiple vendors detected**")
            
            if val_data["addresses"]:
                report.append(f"- **Address**: {val_data['addresses'][0]}")
                if not val_data["address_consistent"]:
                    report.append(f"  - ⚠️ **Inconsistent addresses**: {len(val_data['addresses'])} different addresses")
        
        # Documents requiring review
        needs_review = [v for v in all_validations if v["needs_review"]]
        if needs_review:
            report.append("\n## DOCUMENTS REQUIRING REVIEW\n")
            
            for val in needs_review:
                report.append(f"\n### ❌ {val['source_file']}\n")
                report.append(f"- **Property**: {val['property_name'] or 'Unknown'}")
                report.append(f"- **Type**: {val['document_type']}")
                report.append(f"- **Confidence**: {val['confidence_score']}")
                
                if val["critical_missing"]:
                    report.append(f"- **Missing Critical Fields**:")
                    for field in val["critical_missing"]:
                        report.append(f"  - `{field}`")
                
                if val["warnings"]:
                    report.append(f"- **Warnings**:")
                    for warning in val["warnings"]:
                        report.append(f"  - {warning}")
        
        # Recommendations
        report.append("\n## RECOMMENDATIONS\n")
        
        if summary['low_confidence'] > 0:
            report.append(f"1. **Manual Review Required**: {summary['low_confidence']} documents with confidence < 0.70")
            report.append("   - Verify all critical fields are correct")
            report.append("   - Check source documents for clarity")
            report.append("   - Consider re-scanning low-quality images\n")
        
        if summary['critical_count'] > 0:
            report.append(f"2. **Missing Critical Data**: {summary['critical_count']} documents missing essential fields")
            report.append("   - Property name, vendor name, dates, or amounts may be missing")
            report.append("   - Review source documents for completeness\n")
        
        inconsistent_properties = [p for p, v in cross_validation.items() if not v["vendor_consistent"]]
        if inconsistent_properties:
            report.append(f"3. **Vendor Inconsistencies**: {len(inconsistent_properties)} properties with multiple vendors")
            report.append(f"   - Properties: {', '.join(inconsistent_properties)}")
            report.append("   - Verify if this is expected (e.g., vendor changes)\n")
        
        if summary['avg_confidence'] >= 0.90:
            report.append("✅ **Overall Quality**: Excellent - most documents extracted successfully")
        elif summary['avg_confidence'] >= 0.80:
            report.append("✅ **Overall Quality**: Good - minor issues detected")
        elif summary['avg_confidence'] >= 0.70:
            report.append("⚠️ **Overall Quality**: Fair - review recommended for flagged documents")
        else:
            report.append("❌ **Overall Quality**: Poor - significant issues detected, comprehensive review needed")
        
        return "\n".join(report)
    
    def _generate_summary(self, all_validations):
        """Generate summary statistics"""
        
        total = len(all_validations)
        needs_review = sum(1 for v in all_validations if v["needs_review"])
        avg_confidence = sum(v["confidence_score"] for v in all_validations) / total if total > 0 else 0
        critical_count = sum(1 for v in all_validations if v["critical_missing"])
        
        high_confidence = sum(1 for v in all_validations if v["confidence_score"] >= 0.85)
        medium_confidence = sum(1 for v in all_validations if 0.70 <= v["confidence_score"] < 0.85)
        low_confidence = sum(1 for v in all_validations if v["confidence_score"] < 0.70)
        
        return {
            "total": total,
            "needs_review": needs_review,
            "review_percent": (needs_review / total * 100) if total > 0 else 0,
            "avg_confidence": avg_confidence,
            "critical_count": critical_count,
            "high_confidence": high_confidence,
            "medium_confidence": medium_confidence,
            "low_confidence": low_confidence
        }
    
    def _get_nested(self, data, path):
        """Get nested dictionary value by dot notation path"""
        parts = path.split(".")
        value = data
        for part in parts:
            if isinstance(value, dict):
                value = value.get(part)
            else:
                return None
        return value


def main():
    parser = argparse.ArgumentParser(
        description="Validate waste document extraction data"
    )
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="Path to extraction JSON file"
    )
    parser.add_argument(
        "--output", "-o",
        help="Output file path (default: validation_report.md)"
    )
    parser.add_argument(
        "--format", "-f",
        choices=["markdown", "json"],
        default="markdown",
        help="Output format"
    )
    parser.add_argument(
        "--confidence-threshold", "-t",
        type=float,
        default=0.70,
        help="Confidence threshold for flagging (default: 0.70)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Verbose output"
    )
    
    args = parser.parse_args()
    
    # Load extraction data
    if args.verbose:
        print(f"Loading extraction data from {args.input}...")
    
    with open(args.input, "r") as f:
        data = json.load(f)
    
    # Get document records
    if "document_records" in data:
        records = data["document_records"]
    elif isinstance(data, list):
        records = data
    else:
        print("Error: Invalid JSON structure. Expected 'document_records' key or list of records.")
        return 1
    
    if args.verbose:
        print(f"Found {len(records)} documents to validate\n")
    
    # Validate
    validator = WasteExtractionValidator(confidence_threshold=args.confidence_threshold)
    
    all_validations = []
    for record in records:
        validation = validator.validate_document(record)
        all_validations.append(validation)
        
        if args.verbose:
            status = "✅" if not validation["needs_review"] else "⚠️"
            print(f"{status} {validation['source_file']}: Confidence {validation['confidence_score']}")
    
    # Cross-validate
    cross_validation = validator.cross_validate_batch(records)
    
    # Generate report
    if args.verbose:
        print("\nGenerating validation report...")
    
    report = validator.generate_report(all_validations, cross_validation, args.format)
    
    # Output
    if args.output:
        output_path = args.output
    else:
        ext = "md" if args.format == "markdown" else "json"
        output_path = f"validation_report.{ext}"
    
    with open(output_path, "w") as f:
        f.write(report)
    
    if args.verbose:
        print(f"\nValidation report saved to: {output_path}")
    
    # Print summary to console
    summary = validator._generate_summary(all_validations)
    print(f"\n{'='*60}")
    print("VALIDATION SUMMARY")
    print(f"{'='*60}")
    print(f"Total Documents:       {summary['total']}")
    print(f"Needs Review:          {summary['needs_review']} ({summary['review_percent']:.1f}%)")
    print(f"Average Confidence:    {summary['avg_confidence']:.2f}")
    print(f"High Confidence:       {summary['high_confidence']}")
    print(f"Medium Confidence:     {summary['medium_confidence']}")
    print(f"Low Confidence:        {summary['low_confidence']}")
    print(f"{'='*60}\n")
    
    if summary['low_confidence'] > 0:
        print(f"⚠️  WARNING: {summary['low_confidence']} documents require manual review")
    else:
        print("✅ All documents meet quality thresholds")
    
    return 0


if __name__ == "__main__":
    exit(main())
