/**
 * Google Apps Script for E-commerce Invoice App (v2.1 - With Document Owner)
 * 
 * Instructions:
 * 1. Open your existing Google Apps Script project.
 * 2. Replace ALL code with this new version.
 * 3. Run 'setupSheet()' ONCE to add the new 'Document Owner' column.
 *    (It will try to preserve existing data but backing up your sheet is recommended).
 * 4. Deploy > Manage Deployments > Edit (pencil) > New Version > Deploy.
 *    (Crucial: You must create a NEW VERSION for changes to take effect).
 */

function setupSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.rename("YEGENLLC"); // Rename the file
    var sheet = ss.getActiveSheet();
    // Check headers
    var firstRow = sheet.getRange(1, 1, 1, 20).getValues()[0];

    // Define Desired Headers
    var headers = ["ID", "Date", "Type", "Category", "Document Owner", "Description", "Amount", "Currency", "USD Value", "Invoice No", "Timestamp"];

    // If headers don't match or 'Document Owner' is missing, let's just rewrite headers if ID is present
    // Or simpler: Check if 'Document Owner' exists, if not insert it.

    var ownerIdx = firstRow.indexOf("Document Owner");

    if (ownerIdx == -1) {
        // Assume standard structure: ID(0), Date(1), Type(2), Cat(3), Desc(4)...
        // We want to insert Document Owner after Category (index 3) -> so at visual index 5 (1-based)

        // Let's verify if we have the standard base.
        if (firstRow[0] === "ID") {
            // Insert Column after Category (Column 4)
            sheet.insertColumnAfter(4);
            sheet.getRange(1, 5).setValue("Document Owner").setFontWeight("bold");
        } else {
            // Initialize from scratch
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
        }
    }
}

function doGet(e) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
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
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        var rows = sheet.getDataRange().getValues();

        if (action === 'create') {
            var usdValue = calculateUsd(body.amount, body.currency);
            var newId = Utilities.getUuid();
            // Headers: ID, Date, Type, Category, Document Owner, Description, Amount, Currency, USD Value, Invoice No, Timestamp
            sheet.appendRow([
                newId,
                body.date,
                body.type,
                body.category,
                body.documentOwner || '', // New field
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

            // Update specific cells (Index is 0-based, Range is 1-based)
            // Col Mapping: 
            // 1:ID, 2:Date, 3:Type, 4:Cat, 5:Owner, 6:Desc, 7:Amt, 8:Curr, 9:USD, 10:Inv
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

            for (var i = 0; i < ids.length; i++) {
                var freshRows = sheet.getDataRange().getValues();
                var idx = findRowIndexById(freshRows, ids[i]);
                if (idx != -1) {
                    sheet.deleteRow(idx + 1);
                }
            }

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

function backupSheet(year) {
    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var file = DriveApp.getFileById(ss.getId());
        var parentFolder = DriveApp.getRootFolder(); // Default to root

        // 1. Find or Create 'ecomm' folder
        var ecommIter = parentFolder.getFoldersByName("ecomm");
        var ecommFolder;
        if (ecommIter.hasNext()) {
            ecommFolder = ecommIter.next();
        } else {
            ecommFolder = parentFolder.createFolder("ecomm");
        }

        // 2. Find or Create Year folder inside 'ecomm'
        var yearIter = ecommFolder.getFoldersByName(year.toString());
        var yearFolder;
        if (yearIter.hasNext()) {
            yearFolder = yearIter.next();
        } else {
            yearFolder = ecommFolder.createFolder(year.toString());
        }

        // 3. Define new filename
        var newName = year + " YEGENLLC";

        // 4. Check if file exists and trash it
        var existingFiles = yearFolder.getFilesByName(newName);
        while (existingFiles.hasNext()) {
            existingFiles.next().setTrashed(true);
        }

        // 5. Make a copy
        file.makeCopy(newName, yearFolder);

        return { result: "success", message: "Backup created: " + newName };

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
