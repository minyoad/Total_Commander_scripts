// (c) Infocatcher 2011, 2013
// version 0.2.2 - 2013-06-30

// Usage:
// Add context menu entries:
//   "%SystemRoot%\system32\wscript.exe" explorer_context.js
// Remove context menu entries:
//   "%SystemRoot%\system32\wscript.exe" explorer_context.js -r
// Use -g flag to add context menu entries for all users (admin rights required)

var labelDirDrive = "Открыть в &Total Commander";
var labelFile = "Показать в &Total Commander";
var icon = "%COMMANDER_PATH%\\desktop.ico";

var testEnvVarFailed = "Не удалось найти %envVar%.\nЗапустите этот скрипт из Total Commander!";
var titleWarning = "Внимание!";
var titleError = "Ошибка!";
var successAdd = "Записи успешно добавлены в реестр!";
var successRemove = "Записи успешно удалены из реестра!";

var cmdLine = '"%COMMANDER_PATH%\\TOTALCMD.EXE" /O /S /T "%1\\:"'; // A kind of magic for archives :)
var cmdNameDirDrive = "open_in_Total_Commander";
var cmdNameFile = "show_in_Total_Commander";
var testEnvVar = "%COMMANDER_PATH%";
testEnvVarFailed = testEnvVarFailed.replace(/%envVar%/g, testEnvVar);

var remove = getArg("r", false);
var global = getArg("g", false);
var tcPath = getArg("tc");

if(tcPath) {
	cmdLine = cmdLine.replace(/%COMMANDER_PATH%/ig, tcPath);
	icon = icon.replace(/%COMMANDER_PATH%/ig, tcPath);
}

var wsh = new ActiveXObject("WScript.shell");
var regPath = global
	? "HKEY_CLASSES_ROOT"
	: "HKEY_CURRENT_USER\\Software\\Classes";

assoc();

function assoc() {
	try {
		if(!_assoc())
			throw "fail";
	}
	catch(e) {
		// Windows Vista/7 and admin rights required
		//WScript.Echo(e.name + "\n" + e.message);
		if(e.name)
			wsh.Popup(e.name + "\n" + e.message, -1, titleWarning, 48 /*MB_ICONEXCLAMATION*/);
		if(tcPath)
			WScript.Quit();
		tcPath = wsh.ExpandEnvironmentStrings("%COMMANDER_PATH%").replace(/[\\'"]/g, "\\$&");
		if(tcPath.charAt(0) == "%")
			WScript.Quit();
		var path = wsh.ExpandEnvironmentStrings("%SystemRoot%\\system32\\wscript.exe");
		var args = "\"" + WScript.ScriptFullName + "\" -r=" + remove + " -g=" + global + " \"-tc='" + tcPath + "'\"";
		new ActiveXObject("Shell.Application").ShellExecute(path, args, "" /*directory*/, "runas");
	}
}
function _assoc() {
	if(remove) {
		var errors = [];
		var regDelete = function(key) {
			try {
				wsh.RegDelete(key);
			}
			catch(e) {
				//(0x100000000-2147024894).toString(16) = 80070002 // wrong link
				//(0x100000000-2147024891).toString(16) = 80070005 // can't remove
				if(e.number != -2147024894)
					errors[errors.length] = e.message;
				//var r = [];
				//for(var p in e)
				//	r.push(p + " = " + e[p]);
				//WScript.Echo(r.join("\n"));
			}
		};

		regDelete(regPath + "\\Directory\\shell\\" + cmdNameDirDrive + "\\command\\");
		regDelete(regPath + "\\Directory\\shell\\" + cmdNameDirDrive + "\\");

		regDelete(regPath + "\\Drive\\shell\\" + cmdNameDirDrive + "\\command\\");
		regDelete(regPath + "\\Drive\\shell\\" + cmdNameDirDrive + "\\");

		regDelete(regPath + "\\*\\shell\\" + cmdNameFile + "\\command\\");
		regDelete(regPath + "\\*\\shell\\" + cmdNameFile + "\\");

		if(errors.length)
			wsh.Popup(errors.join("\n"), -1, titleWarning, 48 /*MB_ICONEXCLAMATION*/);
		else
			wsh.Popup(successRemove, 8, WScript.ScriptName, 64 /*MB_ICONINFORMATION*/);
		return !errors.length;
	}
	else {
		if(
			testEnvVar
			&& /%[^%]+%/.test(cmdLine)
			&& wsh.ExpandEnvironmentStrings(testEnvVar) == testEnvVar
		) {
			wsh.Popup(testEnvVarFailed, -1, titleError, 16 /*MB_ICONERROR*/);
			WScript.Quit();
		}

		cmdLine = wsh.ExpandEnvironmentStrings(cmdLine);
		icon = wsh.ExpandEnvironmentStrings(icon);

		wsh.RegWrite(regPath + "\\Directory\\shell\\" + cmdNameDirDrive + "\\", labelDirDrive, "REG_SZ");
		wsh.RegWrite(regPath + "\\Directory\\shell\\" + cmdNameDirDrive + "\\Icon", icon, "REG_SZ");
		wsh.RegWrite(regPath + "\\Directory\\shell\\" + cmdNameDirDrive + "\\command\\", cmdLine, "REG_SZ");

		wsh.RegWrite(regPath + "\\Drive\\shell\\" + cmdNameDirDrive + "\\", labelDirDrive, "REG_SZ");
		wsh.RegWrite(regPath + "\\Drive\\shell\\" + cmdNameDirDrive + "\\Icon", icon, "REG_SZ");
		wsh.RegWrite(regPath + "\\Drive\\shell\\" + cmdNameDirDrive + "\\command\\", cmdLine, "REG_SZ");

		wsh.RegWrite(regPath + "\\*\\shell\\" + cmdNameFile + "\\", labelFile, "REG_SZ");
		wsh.RegWrite(regPath + "\\*\\shell\\" + cmdNameFile + "\\Icon", icon, "REG_SZ");
		wsh.RegWrite(regPath + "\\*\\shell\\" + cmdNameFile + "\\command\\", cmdLine, "REG_SZ");

		wsh.Popup(successAdd, 8, WScript.ScriptName, 64 /*MB_ICONINFORMATION*/);
		return true;
	}
}

function getArg(argName, defaultVal) {
	var args = {};
	for(var i = 0, argsCount = WScript.Arguments.length; i < argsCount; i++)
		if(/^[-\/](\w+)(=(.+))?$/.test(WScript.Arguments(i)))
			args[RegExp.$1.toLowerCase()] = RegExp.$3 ? eval(RegExp.$3) : true;
	getArg = function(argName, defaultVal) {
		argName = argName.toLowerCase();
		return typeof args[argName] == "undefined" // argName in args
			? defaultVal
			: args[argName];
	};
	return getArg(argName, defaultVal);
}