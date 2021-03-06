// (c) Infocatcher 2010, 2013
// version 0.1.2 - 2013-02-18

// Usage:
//   [%SystemRoot%\system32\wscript.exe] backup.js fileOrFolderToBackup
// Force use ZIP:
//   backup.js :zip-on fileOrFolderToBackup
// Force don't use ZIP:
//   backup.js :zip-off fileOrFolderToBackup
// In Total Commander you can use %S argument.

//== Settings begin
var BACKUPS_DIR = "_backups\\"; // Or ""
var ZIP = true;
var ZIP_CMD = '"%COMMANDER_PATH%\\arch\\7-Zip\\7zG.exe" a -tzip -mx9 -ssw -- "<newFile>" "<curFile>"';
var checkEnvVars = true;
//== Settings end

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

var fso = new ActiveXObject("Scripting.FileSystemObject");
var wsh = new ActiveXObject("WScript.Shell");

var argsCount = WScript.Arguments.length;
if(!argsCount) {
	wsh.Popup(
		_localize("Usage:\n") + WScript.ScriptName + " file1 file2", -1,
		_localize("Wrong command line arguments!") + " – " + WScript.ScriptName,
		48 /*MB_ICONEXCLAMATION*/
	);
	WScript.Quit();
}

var zipCmd = wsh.ExpandEnvironmentStrings(ZIP_CMD);
if(checkEnvVars && zipCmd == ZIP_CMD) {
	wsh.Popup(
		_localize("Couldn't expand environment variables:\n") + ZIP_CMD, -1,
		_localize("Error!") + " – " + WScript.ScriptName,
		16 /*MB_ICONERROR*/
	);
	WScript.Quit();
}

if(BACKUPS_DIR && !fso.FolderExists(BACKUPS_DIR))
	fso.CreateFolder(BACKUPS_DIR);

for(var i = 0; i < argsCount; ++i) {
	var file = WScript.Arguments(i);
	if(file.charAt(0) == ":") {
		file = file.toLowerCase();
		if(file == ":zip-on")
			ZIP = true;
		else if(file == ":zip-off")
			ZIP = false;
		continue;
	}
	backup(file);
}

function backup(file) {
	var isFile = fso.FileExists(file);
	var backupName = BACKUPS_DIR + getBackupName(file, isFile && !ZIP);
	if(ZIP) {
		var cmd = zipCmd
			.replace(/<newFile>/g, backupName + ".zip")
			.replace(/<curFile>/g, file);
		wsh.Exec(cmd);
	}
	else {
		fso[isFile ? "CopyFile" : "CopyFolder"](file, backupName);
	}
}
function getBackupName(file, isFile) {
	if(isFile && /\.[^.]+$/.test(file)) {
		var fileName = RegExp.leftContext;
		var fileExt = RegExp.lastMatch;
	}
	else {
		var fileName = file;
		var fileExt = "";
	}

	var d = new Date();
	var timestamp = "_" + d.getFullYear()     + "-" + zeros(d.getMonth() + 1) + "-" + zeros(d.getDate())
	              + "_" + zeros(d.getHours()) + "-" + zeros(d.getMinutes())   + "-" + zeros(d.getSeconds());

	return fileName + timestamp + fileExt;
}
function zeros(n) {
	if(n > 9)
		return n;
	return "0" + n;
}