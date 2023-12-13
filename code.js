// Modified doGet function for testing purposes
function doGet() {
  return HtmlService.createTemplateFromFile('CameraDropdown').evaluate();
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getDates() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lovSheet = ss.getSheetByName("camera");
  var getLastRow = lovSheet.getLastRow();
  var uniqueDatesSet = new Set();

  for (var i = 2; i <= getLastRow; i++) {
    var timestamp = lovSheet.getRange(i, 1).getValue();
    var date = new Date(timestamp);
    var formattedDate = Utilities.formatDate(date, ss.getSpreadsheetTimeZone(), 'MM/dd/yyyy');
    uniqueDatesSet.add(formattedDate);
  }

  var return_array = Array.from(uniqueDatesSet);
  return return_array;
}

function getTable(displayMode, selectedDate) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lovSheet = ss.getSheetByName("camera");
  var dataRange = lovSheet.getDataRange();
  var dataValues = dataRange.getValues();

  // Convert the timestamp strings to Date objects
  dataValues.forEach(function (row) {
    row[0] = new Date(row[0]);
  });

  // Filter data based on date
  var filteredData = dataValues.filter(function (row) {
    return (
      Utilities.formatDate(
        row[0],
        ss.getSpreadsheetTimeZone(),
        "MM/dd/yyyy"
      ) === selectedDate
    );
  });

  var resultArray = [];

  if (filteredData.length > 0) {
  // Determine the number of numerical columns dynamically
  var numColumns = filteredData[0].length - 1; // Subtracting timestamp column

  if (displayMode === "daily") {
    var dailyData = {};
    filteredData.forEach(function (row) {
      var hour = Utilities.formatDate(row[0], ss.getSpreadsheetTimeZone(), "HH");
      if (!dailyData[hour]) {
        dailyData[hour] = row.slice(1);
      } else {
        dailyData[hour] = dailyData[hour].map(function (val, index) {
          return val + row[index + 1];
        });
      }
    });

    // Convert dailyData to array for HTML rendering
    resultArray = Object.keys(dailyData).map(function (hour) {
      return [hour, ...dailyData[hour]];
    });
  } else if (displayMode === "weekly") {
    var startDate = new Date(selectedDate);
    var endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 7);

    var weeklyData = dataValues.filter(function (row) {
      var rowDate = new Date(row[0]);
      return (
        rowDate >= startDate &&
        rowDate <= endDate
      );
    });

    var weeklyAggregated = {};
    weeklyData.forEach(function (row) {
      var date = Utilities.formatDate(row[0], ss.getSpreadsheetTimeZone(), "MM/dd/yyyy");
      if (!weeklyAggregated[date]) {
        weeklyAggregated[date] = row.slice(1);
      } else {
        weeklyAggregated[date] = weeklyAggregated[date].map(function (
          val,
          index
        ) {
          return val + row[index + 1];
        });
      }
    });

    // Convert weeklyAggregated to array for HTML rendering
    resultArray = Object.keys(weeklyAggregated).map(function (date) {
      return [date, ...weeklyAggregated[date]];
    });
  }
}

// Step 3: Filtering Non-Zero Values
resultArray = resultArray.filter(function (row) {
  return row.slice(1).some(function (value) {
    return value !== 0;
  });
});

// Step 4: Displaying Tables
var tableHtml =
  '<table border="1"><tr><th>' +
  (displayMode === "daily" ? "Hour" : "Date") +
  "</th>";

// Dynamically generate column headers
var headerRow = dataValues[0].slice(1);
headerRow.forEach(function (header) {
  tableHtml += '<th>' + header + "</th>";
});

tableHtml += "</tr>";
resultArray.forEach(function (row) {
  tableHtml += "<tr>";
  tableHtml += "<td>" + row[0] + "</td>";

  // Dynamically generate table cells
  for (var i = 1; i <= numColumns; i++) {
    tableHtml += "<td>" + row[i] + "</td>";
  }

  tableHtml += "</tr>";
});
tableHtml += "</table>";

return tableHtml;
}