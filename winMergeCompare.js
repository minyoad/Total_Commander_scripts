// (c) Infocatcher 2010, 2013
// version 0.1.3 - 2013-02-18

// Usage in Total Commander:
// Command:     "%SystemRoot%\system32\wscript.exe" "%COMMANDER_PATH%\scripts\winMergeCompare.js"
// Parameters:  %S %T%M
// Start path:  <empty>

var wsh = new ActiveXObject("WScript.Shell");
var fso = new ActiveXObject("Scripting.FileSystemObject");

var winMerge = "%ProgramFiles%\\WinMerge\\WinMergeU.exe";
if(!fso.FileExists(wsh.ExpandEnvironmentStrings(winMerge)))
	winMerge = "%COMMANDER_PATH%\\..\\WinMergePortable\\WinMergePortable.exe";

var compareCmd = '"' + winMerge + '" "<f1>" "<f2>"';
var checkEnvVars = true;

function _localize(s) {
	var strings = {
		"Wrong command line arguments!": {
			ru: "Неправильные параметры командной строки!"
		},
		"Usage:\n": {
			ru: "Использование:\n"
		},
		"Error!": {
			ru: "Ошибка!"
		},
		"Couldn't expand environment variables:\n": {
			ru: "Не удалось развернуть переменные окружения:\n"
		}
	};
	var lng = "en";
	try {
		var window = new ActiveXObject("htmlfile").parentWindow;
		lng = window.navigator.browserLanguage.match(/^\w*/)[0] || lng;
		window = null;
	}
	catch(e) {
	}
	_localize = function(s) {
		return strings[s] && strings[s][lng] || s;
	};
	return _localize(s);
}

var argsCount = WScript.Arguments.length;
if(argsCount < 2) {
	wsh.Popup(
		_localize("Usage:\n") + WScript.ScriptName + " file1 file2",
		-1,
		_localize("Wrong command line arguments!") + " – " + WScript.ScriptName,
		48 /*MB_ICONEXCLAMATION*/
	);
	WScript.Quit();
}

var cmd = wsh.ExpandEnvironmentStrings(compareCmd);
if(checkEnvVars && compareCmd.indexOf("%") != -1 && cmd == compareCmd) {
	wsh.Popup(
		_localize("Couldn't expand environment variables:\n") + compareCmd,
		-1,
		_localize("Error!") + " – " + WScript.ScriptName,
		16 /*MB_ICONERROR*/
	);
	WScript.Quit();
}

var file1 = WScript.Arguments(0);
var file2 = WScript.Arguments(1);

try {
	// Always compare old file with new
	if(new Date(fso.GetFile(file1).DateLastModified) > new Date(fso.GetFile(file2).DateLastModified)) {
		var tmp = file1;
		file1 = file2;
		file2 = tmp;
	}
}
catch(e) {
}

cmd = cmd
	.replace(/<f1>/g, file1)
	.replace(/<f2>/g, file2);
wsh.Exec(cmd);