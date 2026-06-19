package com.attendance.util;

import com.attendance.dto.AttendanceDto;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class ExcelReportUtils {

    /**
     * Generates an Excel report from a list of AttendanceDto.
     */
    public static byte[] generateAttendanceExcelReport(List<AttendanceDto> attendanceList) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Attendance Report");

            // Header Font & Style
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            
            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            // Row for Header
            Row headerRow = sheet.createRow(0);
            String[] columns = {"Employee Code", "Employee Name", "Date", "Check In", "Check Out", "Total Hours", "Status", "GPS Coordinates"};
            for (int col = 0; col < columns.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
                cell.setCellStyle(headerCellStyle);
            }

            // Formatters
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");

            int rowIdx = 1;
            for (AttendanceDto attendance : attendanceList) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(attendance.getEmployeeCode() != null ? attendance.getEmployeeCode() : "");
                row.createCell(1).setCellValue(attendance.getEmployeeName() != null ? attendance.getEmployeeName() : "");
                row.createCell(2).setCellValue(attendance.getAttendanceDate() != null ? attendance.getAttendanceDate().format(dateFormatter) : "");
                row.createCell(3).setCellValue(attendance.getCheckIn() != null ? attendance.getCheckIn().format(timeFormatter) : "");
                row.createCell(4).setCellValue(attendance.getCheckOut() != null ? attendance.getCheckOut().format(timeFormatter) : "");
                row.createCell(5).setCellValue(attendance.getTotalHours() != null ? attendance.getTotalHours() : 0.0);
                row.createCell(6).setCellValue(attendance.getStatus() != null ? attendance.getStatus() : "");
                
                StringBuilder gps = new StringBuilder();
                if (attendance.getCheckInLatitude() != null && attendance.getCheckInLongitude() != null) {
                    gps.append("In: ").append(attendance.getCheckInLatitude()).append(", ").append(attendance.getCheckInLongitude());
                }
                if (attendance.getCheckOutLatitude() != null && attendance.getCheckOutLongitude() != null) {
                    if (gps.length() > 0) gps.append(" | ");
                    gps.append("Out: ").append(attendance.getCheckOutLatitude()).append(", ").append(attendance.getCheckOutLongitude());
                }
                row.createCell(7).setCellValue(gps.toString());
            }

            for (int col = 0; col < columns.length; col++) {
                sheet.autoSizeColumn(col);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
}
