/**
 * Google Apps Script for E-commerce Invoice App (v3.0 - Live/Archive Workflow)
 * 
 * Instructions:
 * 1. Open your existing Google Apps Script project.
 * 2. Replace ALL code with this new version.
 * 3. Run 'setupSheet()' ONCE (Optional, if columns missing).
 * 4. Deploy > Manage Deployments > Edit (pencil) > New Version > Deploy.
 */

function setupSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    // ss.rename("YEGENLLC"); // DISABLED: Prevent renaming backup files
    var sheet = ss.getActiveSheet();

    // Check headers
    var firstRow = sheet.getRange(1, 1, 1, 20).getValues()[0];
    var headers = ["ID", "Date", "Type", "Category", "Document Owner", "Description", "Amount", "Currency", "USD Value", "Invoice No", "Timestamp"];

    var ownerIdx = firstRow.indexOf("Document Owner");

    if (ownerIdx == -1) {
        if (firstRow[0] === "ID") {
            sheet.insertColumnAfter(4);
            sheet.getRange(1, 5).setValue("Document Owner").setFontWeight("bold");
        } else {
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
        }
    }
}

function doGet(e) {
    var year = e.parameter.year;
    var action = e.parameter.action;
    var ss;

    // Separate action for fetching years list
    if (action === 'getYears') {
        return getYearsList();
    }

    // Determine which file to read from
    try {
        if (year && year.length === 4) {
            // Try to find the Archive file for this year
            var archiveFile = findArchiveFile(year);
            if (archiveFile) {
                ss = SpreadsheetApp.open(archiveFile);
            } else {
                // Fallback to Master if year requested but not found (or treat as live)
                ss = SpreadsheetApp.getActiveSpreadsheet();
            }
        } else {
            // Default to Master
            ss = SpreadsheetApp.getActiveSpreadsheet();
        }
    } catch (err) {
        // Fallback on error
        console.error("Error opening year file: " + err);
        ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    var sheet = ss.getActiveSheet();
    var data = sheet.getDataRange().getValues();

    // If empty or just headers
    if (data.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify([]))
            .setMimeType(ContentService.MimeType.JSON);
    }

    var headers = data[0];
    var rows = data.slice(1);

    var result = rows.map(function (row) {
        var obj = {};
        headers.forEach(function (header, i) {
            obj[header] = row[i];
        });
        return obj;
    }).reverse(); // Show newest first

    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        var body = JSON.parse(e.postData.contents);
        var action = body.action || 'create';

        // WRITE Operations ALWAYS go to the MASTER (Active) Spreadsheet
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getActiveSheet();
        var rows = sheet.getDataRange().getValues();

        if (action === 'create') {
            var usdValue = calculateUsd(body.amount, body.currency);
            var newId = Utilities.getUuid();
            sheet.appendRow([
                newId,
                body.date,
                body.type,
                body.category,
                body.documentOwner || '',
                body.description,
                body.amount,
                body.currency,
                usdValue,
                body.invoiceNo,
                new Date()
            ]);
            return response({ result: "success", id: newId });
        }

        else if (action === 'update') {
            var rowIndex = findRowIndexById(rows, body.id);
            if (rowIndex == -1) return response({ result: "error", message: "ID not found" });

            var usdValue = calculateUsd(body.amount, body.currency);
            var realRow = rowIndex + 1;

            sheet.getRange(realRow, 2).setValue(body.date);
            sheet.getRange(realRow, 3).setValue(body.type);
            sheet.getRange(realRow, 4).setValue(body.category);
            sheet.getRange(realRow, 5).setValue(body.documentOwner || '');
            sheet.getRange(realRow, 6).setValue(body.description);
            sheet.getRange(realRow, 7).setValue(body.amount);
            sheet.getRange(realRow, 8).setValue(body.currency);
            sheet.getRange(realRow, 9).setValue(usdValue);
            sheet.getRange(realRow, 10).setValue(body.invoiceNo);

            return response({ result: "success" });
        }

        else if (action === 'delete') {
            var ids = body.ids || [body.id];
            // Delete from bottom up to avoid index shifting issues, though re-finding by ID is safer
            // For simplicity, we'll just re-fetch data for each delete or sort IDs
            // Optimally:
            ids.forEach(function (id) {
                var currentData = sheet.getDataRange().getValues();
                var idx = findRowIndexById(currentData, id);
                if (idx != -1) sheet.deleteRow(idx + 1);
            });
            return response({ result: "success" });
        }

        else if (action === 'backup') {
            var year = body.year;
            if (!year) return response({ result: "error", message: "Year is required" });
            var result = backupSheet(year);
            return response(result);
        }

    } catch (e) {
        return response({ result: "error", error: e.toString() });
    } finally {
        lock.releaseLock();
    }
}

// Helper: Find Archive File
// Folder Structure: ecomm > [Year] > [Year] YEGENLLC
function findArchiveFile(year) {
    try {
        var parentFolder = DriveApp.getRootFolder();
        var ecommIter = parentFolder.getFoldersByName("ecomm");
        if (!ecommIter.hasNext()) return null;
        var ecommFolder = ecommIter.next();

        var yearIter = ecommFolder.getFoldersByName(year.toString());
        if (!yearIter.hasNext()) return null;
        var yearFolder = yearIter.next();

        var files = yearFolder.getFilesByName(year + " YEGENLLC");
        if (files.hasNext()) return files.next();

        return null;
    } catch (e) {
        console.error(e);
        return null; // Return null on any error
    }
}

function getYearsList() {
    // Scan 'ecomm' folder for year folders
    try {
        var years = [];
        var parentFolder = DriveApp.getRootFolder();
        var ecommIter = parentFolder.getFoldersByName("ecomm");

        if (ecommIter.hasNext()) {
            var ecommFolder = ecommIter.next();
            var folders = ecommFolder.getFolders();
            while (folders.hasNext()) {
                var folder = folders.next();
                var name = folder.getName();
                // Simple regex to check if folder name is a 4-digit year
                if (/^\d{4}$/.test(name)) {
                    years.push(name);
                }
            }
        }
        // Sort descending
        years.sort(function (a, b) { return b - a });
        return ContentService.createTextOutput(JSON.stringify(years))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify([]))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function backupSheet(year) {
    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var file = DriveApp.getFileById(ss.getId());
        var parentFolder = DriveApp.getRootFolder();

        var ecommIter = parentFolder.getFoldersByName("ecomm");
        var ecommFolder;
        if (ecommIter.hasNext()) {
            ecommFolder = ecommIter.next();
        } else {
            ecommFolder = parentFolder.createFolder("ecomm");
        }

        var yearIter = ecommFolder.getFoldersByName(year.toString());
        var yearFolder;
        if (yearIter.hasNext()) {
            yearFolder = yearIter.next();
        } else {
            yearFolder = ecommFolder.createFolder(year.toString());
        }

        var newName = year + " YEGENLLC";
        var existingFiles = yearFolder.getFilesByName(newName);
        while (existingFiles.hasNext()) {
            existingFiles.next().setTrashed(true);
        }

        var newFile = file.makeCopy(newName, yearFolder);

        return {
            result: "success",
            message: "Backup created: " + newName,
            url: newFile.getUrl()
        };

    } catch (err) {
        return { result: "error", message: err.toString() };
    }
}

function findRowIndexById(rows, id) {
    for (var i = 0; i < rows.length; i++) {
        if (rows[i][0] == id) return i;
    }
    return -1;
}

function calculateUsd(amount, currency) {
    var rates = { USD: 1, CAD: 0.75, TRY: 0.030, CNY: 0.14, EUR: 1.05, GBP: 1.25 };
    var rate = rates[currency] || 1;
    return (amount * rate).toFixed(2);
}

function response(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
