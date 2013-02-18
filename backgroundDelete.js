// (c) Infocatcher 2010-2012
// version 0.1.5 - 2012-10-15

// Rename file(s) or folder(s) (fast!) and delete them.

// Usage:
//   [%SystemRoot%\system32\wscript.exe] backgroundDelete.js fileOrFolderToDelete
// In Total Commander:
//   Command:    wscript.exe "%COMMANDER_PATH%\scripts\backgroundDelete.js"
//   Parameters: %S
//   Start path: <empty>

var confirmDelete = true;
var confirmDeleteMaxItems = 10;

var fso = new ActiveXObject("Scripting.FileSystemObject");
var wsh = new ActiveXObject("WScript.shell");

var argsCount = WScript.Arguments.length;
if(!argsCount) {
	msg("Usage:\n" + WScript.ScriptName + " file1 file2", "Wrong command line arguments!", true);
	WScript.Quit();
}

var files = [];
for(var i = 0; i < argsCount; ++i)
	files.push(WScript.Arguments(i));

if(confirmDelete) {
	var btn = wsh.Popup(
		"Вы действительно хотите удалить выбранные файлы/каталоги ("
			+ argsCount + " шт.)?\n"
			+ cutArray(files).join("\n"),
		-1,
		WScript.ScriptName,
		3|32 /*MB_YESNOCANCEL|MB_ICONQUESTION*/
	);
	if(btn != 6 /*IDYES*/)
		WScript.Quit();
}

var entries = [];
var moveErrors = [];
var deleteErrors = [];

for(var i = 0; i < argsCount; ++i)
	prepareDelete(files[i]);

if(moveErrors.length)
	msg("Не удалось переименовать\n" + cutArray(moveErrors).join("\n"), "Ошибка!");
else {
	wsh.Popup(
		"Все файлы и каталоги успешно перемещены!\n[Данное сообщени будет закрыто через 1 секунду]",
		1,
		WScript.ScriptName,
		64 /*MB_ICONINFORMATION*/
	);
}

for(var i = 0, len = entries.length; i < len; ++i)
	deleteEntry(entries[i]);

if(deleteErrors.length)
	msg("Не удалось удалить\n" + cutArray(deleteErrors).join("\n"), "Ошибка!");

function getRandomStr() {
	return Math.random().toString(36).substr(2);
}
function getRandomName(path) {
	for(;;) {
		var newPath = path.replace(/[^\\\/]+[\\\/]*$/, "~$&~" + getRandomStr() + ".deleted");
		if(!fso.FileExists(newPath) && !fso.FolderExists(newPath))
			return newPath;
	}
}
function prepareDelete(path) {
	var newPath = getRandomName(path);
	var type = fso.FileExists(path) ? "File" : "Folder";
	try {
		fso["Move" + type](path, newPath);
		entries.push({
			type: type,
			path: path,
			newPath: newPath
		});
	}
	catch(e) {
		moveErrors.push('"' + path + '": ' + e.message);
	}
}
function deleteEntry(entry) {
	try {
		fso["Delete" + entry.type](entry.newPath, true);
	}
	catch(e) {
		deleteErrors.push('"' + entry.path + '" => "' + entry.newPath + '": ' + e.message);
	}
}

function cutArray(arr, maxItems) {
	if(!maxItems)
		maxItems = confirmDeleteMaxItems;
	var len = arr.length;
	if(len <= maxItems)
		return arr;
	var ret = [];
	for(var i = 0; i < maxItems; ++i)
		ret.push(arr[i]);
	ret.push("\u2026");
	ret.push(arr[len - 1]);
	return ret;
}
function msg(text, title, warning) {
	wsh.Popup(
		text,
		-1,
		(title ? title + " – " : "") + WScript.ScriptName,
		warning ? 48 /*MB_ICONEXCLAMATION*/ : 16 /*MB_ICONERROR*/
	);
}