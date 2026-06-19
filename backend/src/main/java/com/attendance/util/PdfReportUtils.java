package com.attendance.util;

import com.attendance.dto.AttendanceDto;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class PdfReportUtils {

    /**
     * Generates a PDF attendance summary report from a list of records.
     */
    public static byte[] generateAttendancePdfReport(List<AttendanceDto> attendanceList) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Font styles
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.UNDEFINED, java.awt.Color.WHITE);
            Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

            // Title Block
            Paragraph title = new Paragraph("Smart Attendance Management System", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(5);
            document.add(title);

            Paragraph subtitle = new Paragraph("Attendance Summary Report", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12));
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // Create Table
            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3f, 4f, 3f, 3f, 3f, 2f, 3f});

            // Table Headers
            String[] headers = {"Emp Code", "Name", "Date", "Check In", "Check Out", "Hours", "Status"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setBackgroundColor(java.awt.Color.decode("#002060"));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(6);
                table.addCell(cell);
            }

            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");

            for (AttendanceDto dto : attendanceList) {
                table.addCell(new PdfPCell(new Phrase(dto.getEmployeeCode() != null ? dto.getEmployeeCode() : "", dataFont)));
                table.addCell(new PdfPCell(new Phrase(dto.getEmployeeName() != null ? dto.getEmployeeName() : "", dataFont)));
                table.addCell(new PdfPCell(new Phrase(dto.getAttendanceDate() != null ? dto.getAttendanceDate().format(dateFormatter) : "", dataFont)));
                table.addCell(new PdfPCell(new Phrase(dto.getCheckIn() != null ? dto.getCheckIn().format(timeFormatter) : "", dataFont)));
                table.addCell(new PdfPCell(new Phrase(dto.getCheckOut() != null ? dto.getCheckOut().format(timeFormatter) : "", dataFont)));
                table.addCell(new PdfPCell(new Phrase(dto.getTotalHours() != null ? String.format("%.2f", dto.getTotalHours()) : "0.00", dataFont)));
                
                PdfPCell statusCell = new PdfPCell(new Phrase(dto.getStatus() != null ? dto.getStatus() : "", dataFont));
                statusCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(statusCell);
            }

            document.add(table);
            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }
}
