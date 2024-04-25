$(document).ready(function() {
  $("#outputTable").DataTable();
  // $('#csvInputTable').DataTable();

  $("#csvJsonTab").click(function (e) { 
    e.preventDefault();
    $("#jsonCsvOutput").hide();
    $("#csvJsonOutput").show();
  });

  $("#jsonCsvTab").click(function (e) { 
    e.preventDefault();
    $("#jsonCsvOutput").show();
    $("#csvJsonOutput").hide();
  });

  var jsonInput = CodeMirror.fromTextArea(document.getElementById("jsonInput"), {
    mode: "application/json",
    lineNumbers: true,
    autofocus: true,
    lineWrapping: true,
    indentUnit: 2,
    smartIndent: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    extraKeys: {
      "Ctrl-Space": "autocomplete" // Enable autocomplete with Ctrl+Space
    },
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
  });


  var jsonOutput = CodeMirror.fromTextArea(document.getElementById("jsonOutput"), {
    mode: "application/json",
    lineNumbers: true,
    autofocus: false,
    lineWrapping: true,
    indentUnit: 2,
    smartIndent: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    extraKeys: {
      "Ctrl-Space": "autocomplete" // Enable autocomplete with Ctrl+Space
    },
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
  });

  var jsonOutputFromCsv = CodeMirror.fromTextArea(document.getElementById('jsonOutputFromCsv'), {
    mode: "application/json",
    lineNumbers: true,
    autofocus: true,
    lineWrapping: true,
    indentUnit: 2,
    smartIndent: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    extraKeys: {
      "Ctrl-Space": "autocomplete" // Enable autocomplete with Ctrl+Space
    },
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    readOnly: true
  });

  // Set up initial value
  // jsonInput.setValue("// Paste your raw json here ...");
  jsonOutput.setValue("// Your result is here");

  jsonInput.on("keyup", function(cm, change) {
    var jsonInput = cm.getValue();
    if (jsonInput.trim() === '') 
    {
      jsonOutput.setValue('');
      $("#outputTable tbody").empty(); // Clear existing table rows
    } 
    else 
    {
      try 
      {
        var formattedJson = JSON.parse(jsonInput);
        jsonOutput.setValue(JSON.stringify(formattedJson, null, 2));
        displayTable(formattedJson);
      } 
      catch (error) 
      {
        var tableHtml = '<thead>' +
        '<tr class="fw-semibold">' +
        '<th>Object 1</th>' +
        '<th>Object 2</th>' +
        '<th>Object 3</th>' +
        '<th>Object 4</th>' +
        '<th>Object 5</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' +
        '<tr>' +
        '<td colspan="5" class="text-center">Invalid JSON format. Please check your input.</td>' +
        '<td style="display: none;"></td>' +
        '<td style="display: none;"></td>' +
        '<td style="display: none;"></td>' +
        '<td style="display: none;"></td>' +
        '</tr>' +
        '</tbody>';
        $("#outputTable").DataTable().destroy();
        $("#outputTable").html(tableHtml);
        jsonOutput.setValue('// Invalid JSON format. Please check your input.');
      }
    }
  });

  $('#downloadBtn').on('click', function() 
  {
    var downloadResult = jsonInput.getValue();
    if (downloadResult.trim() === '') 
    {
      alert("Error downloading JSON: Please insert valid JSON");
    } 
    else 
    {
      try 
      {
        var formattedJson = JSON.parse(downloadResult);
        var csvData       = jsonToCsv(formattedJson);
        downloadCsv(csvData, 'formatted_json.csv');
      } 
      catch (error) 
      {
        var errorMessage = 'Error downloading JSON: ' + error;
        alert(errorMessage);
        console.error(errorMessage);
      }
    }
  });

  $('#copyBtn').on('click', function() {
    var formattedJson = jsonOutput.getValue();
    if (formattedJson != '// Your result is here' && formattedJson != '// Invalid JSON format. Please check your input.' && formattedJson != '')
    {
      copyToClipboard(formattedJson);
      alert('JSON copied to clipboard!');
    }
    else
    {
      alert('Please enter valid JSON');
    }
  });

  // Handle file upload change event
  $("#uploadCsvFile").change(function() {
    var file      = $(this)[0].files[0];
    var reader    = new FileReader();

    $("#csvFileLabel").text(file.name);

    reader.onload = function(e) {
      var csv = e.target.result;
      var rows = csv.split("\n").filter(row => row.trim() !== '');
      var index = 0;
      $('#csvInputTable tbody').empty();
  
      rows.forEach(function(row, index) {
        if (index < 1) {
          var headers = row.split(';');
          var headerRow = '<tr>';
          headers.forEach(function(header) {
            headerRow += '<th>' + header + '</th>';
          });
          headerRow += '</tr>';
          $('#csvInputTable thead').append(headerRow);
        } else {
          var cells = row.split(";");
          var html = '';
          cells.forEach(function(cell) {
            html += '<td>' + cell + '</td>';
          });
          $('#csvInputTable tbody').append('<tr>' + html + '</tr>');
        }
      });
  
      $("#csvInputTable").show();
  
      // Destroy DataTable instance after appending data
      $('#csvInputTable').DataTable().destroy();
  
      // Reinitialize DataTable with pageLength option
      $('#csvInputTable').DataTable({
        scrollX: true,
        // searching: false,
        lengthChange: false,
        ordering: true,
        pageLength: 5
      });
      convertCsvToJson(rows, jsonOutputFromCsv);
    };
  
    reader.readAsText(file);
  });
  
  
});

// Function to convert CSV to JSON and display in textarea
function convertCsvToJson(rows, jsonOutputFromCsv) 
{
  var jsonData = [];
  var headers = rows[0].split(";");

  for (var i = 1; i < rows.length; i++) 
  {
    var data = {};
    var cells = rows[i].split(";");

    for (var j = 0; j < cells.length; j++) 
    {
      data[headers[j].trim()] = cells[j].trim();
    }

    jsonData.push(data);
  }

  var jsonOutput = JSON.stringify(jsonData, null, 4);
  jsonOutputFromCsv.setValue(jsonOutput)
  $('#csvJsonOutput').show();
}

// Function to download CSV
function downloadCsv(csv, filename) 
{
  var blob  = new Blob([csv], {type: "text/csv"});
  var url   = URL.createObjectURL(blob);
  var a     = document.createElement('a');
  a.href    = url;
  a.download= filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function jsonToCsv(json) 
{
  var csv     = '';
  var isArray = Array.isArray(json);

  if (!isArray) 
  {
    json = [json]; // Convert single object to array with one element
  }

  if (json.length > 0) 
  {
    var keys  = Object.keys(json[0]);
    csv += keys.join(';') + '\r\n';
    json.forEach(function(obj) 
    {
      var values = keys.map(key => obj[key]);
      csv += values.join(';') + '\r\n';
    });
  }

  return csv;
}

// Function to copy text to clipboard
function copyToClipboard(text) 
{
  var textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

// Function to display table
function displayTable(jsonData) 
{
  var tableHtml = '';
  var scrollX   = false;

  if (!Array.isArray(jsonData)) 
  {
    jsonData = [jsonData];
  }

  if (Array.isArray(jsonData) && jsonData.length > 0) 
  {
    tableHtml += '<thead><tr>';
    Object.keys(jsonData[0]).forEach(function(key) {
      tableHtml += '<th>' + key + '</th>';
    });
    tableHtml += '</tr></thead><tbody>';
    jsonData.forEach(function(row) {
      tableHtml += '<tr>';
      Object.values(row).forEach(function(value) {
        tableHtml += '<td>' + value + '</td>';
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody>';
  }

  $("#outputTable").DataTable().destroy();
  $("#outputTable").html(tableHtml);

  var tableWidth    =   $("#outputTable").width();
  var cardBodyWidth =   $(".card-body").width();
  // console.log("Table width: "+tableWidth);
  // console.log("Card Body width: "+cardBodyWidth);
  if(tableWidth >= cardBodyWidth) scrollX = true;

  $("#outputTable").DataTable({
    scrollX: scrollX,
    pageLength : 5,
  });
}


