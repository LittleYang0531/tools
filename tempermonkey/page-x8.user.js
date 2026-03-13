// ==UserScript==
// @name         学吧快速提交代码
// @namespace    http://tampermonkey.net/
// @version      v1.0.0
// @description  使学吧可以直接提交代码，不需要拖动文件
// @author       LittleYang0531
// @match        https://page.cau.edu.cn/mod/assignment/view.php?id=*
// @icon         https://page.cau.edu.cn/theme/image.php/serenity/theme/1759931637/favicon
// @downloadURL  https://tools.littleyang.com.cn/tempermonkey/page-x8.user.js
// @updateURL    https://tools.littleyang.com.cn/tempermonkey/page-x8.user.js
// @grant        none
// ==/UserScript==

function newSubstr(str, start, end) {
    var startPos = str.indexOf(start) + start.length;
    var endPos = str.indexOf(end, startPos);
    return str.substr(startPos, endPos - startPos);
}
/* function newSubstrLast(str, start, end) {
    var endPos = str.lastIndexOf(end);
    var startPos = str.lastIndexOf(start, endPos) + start.length;
    return str.substr(startPos, endPos - startPos);
} */

(function() {
    'use strict';

    var E = setInterval(async () => {
        var e = document.getElementsByClassName("singlebutton");
        if (e.length == 0) return;
        if (e.length >= 2) {
            alert("Error: Found multiple submit button");
            clearInterval(E);
            return;
        }

        var inputs = e[0].getElementsByTagName("input");
        if (inputs.length != 3) {
            alert("Error: The number of input elements must be exactly 3");
            clearInterval(E);
            return;
        }
        var title = inputs[0].value;
        var contextid = inputs[1].value;
        var userid = inputs[2].value;

        var file = "";
        if (title == "上传文件") {

        } else if (title == "编辑这些文件") {
            var div = document.getElementById("userfiles");
            var as = div.getElementsByTagName("a");
            var fileurl = "";
            for (var i = 0; i < as.length; i++) {
                if (as[i].href.startsWith("https://page.cau.edu.cn/pluginfile.php/" + contextid + "/mod_assignment/submission/")) {
                    fileurl = as[i].href;
                }
            }
            file = await (await fetch(fileurl)).text();
            console.log(file);
        } else {
            alert("Error: Cannot found submit button");
            clearInterval(E);
            return;
        }

        var link = document.createElement("link");
        link.ref = "";
        link.href = "https://unpkg.com/monaco-editor@latest/min/vs/loader.js";

        var main = document.getElementById("region-main").children[0].children[0];
        var oldE = main.children[main.children.length - 1];
        main.children[main.children.length - 1].remove();
        var newDiv = document.createElement("div");
        newDiv.style = "display: flex; flex-direction: column; align-items: center; justify-content: center; width: 50%; margin: auto";
        newDiv.id = "intro";

        var compiler = document.getElementById("assignment_onlinejudge_information").children[0].children[0].children[1].innerHTML;
        const config = [
            { title: "Python（Python, Python3, vPython）", type: "text/x-python", name: "main.py", keywords: [ "Python" ] },
            { title: "C/C++（TDM-GCC, VC, g++, VS）", type: "text/x-c", name: "main.cpp", keywords: [ "C and C++" ] },
            { title: "C#（VS, mono）", type: "text/x-csharp", name: "main.cs", keywords: [ "C#" ] },
            { title: "Java（JDK, openJDK）", type: "text/x-java", name: "Main.java", keywords: [ "Java" ] }
        ];
        var innerDiv = document.createElement("div");
        innerDiv.style = "display: flex; width: 100%; align-items: center; justify-content; center;";
        var select = document.createElement("select");
        select.style = "flex-grow: 1;"
        for (i = 0; i < config.length; i++) {
            var option = document.createElement("option");
            option.value = i;
            option.innerHTML = config[i].title;
            var selected = false;
            for (var j = 0; j < config[i].keywords.length; j++) {
                if (compiler.indexOf(config[i].keywords[j]) != -1) selected = true;
            }
            if (selected) option.selected = selected;
            select.appendChild(option);
        }
        var span = document.createElement("span");
        span.innerHTML = "选择语言：";
        innerDiv.appendChild(span);
        innerDiv.appendChild(select);

        var textarea = document.createElement("textarea");
        textarea.value = file;
        textarea.style = "width: calc(100% - 8px); height: 300px; margin-top: 8px; resize: none; font-family: 'Cascadia Mono', monospace; padding: 4px;";
        var newSubmit = document.createElement("button");
        newSubmit.innerHTML = "提交代码";
        newSubmit.style = "margin-top: 8px;";

        newSubmit.onclick = async () => {
            var upload = await (await fetch("https://page.cau.edu.cn/mod/assignment/type/onlinejudge/upload.php?contextid=" + contextid + "&userid=" + userid)).text();

            var sesskey = newSubstr(upload, "\"sesskey\":\"", "\"");
            var client_id = newSubstr(upload, "\"client_id\":\"", "\"");
            var itemid = newSubstr(upload, "\"itemid\":", ",");
            var files_filemanager = itemid;
            console.log(sesskey, client_id, itemid, files_filemanager);

            // 先获取文件列表
            var json = await (await fetch("https://page.cau.edu.cn/repository/draftfiles_ajax.php?action=list", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `sesskey=${sesskey}&client_id=${client_id}&filepath=%2F&itemid=${itemid}`
            })).json();
            var items = json.list;
            // 删除现有文件
            for (var i = 0; i < items.length; i++) {
                var json2 = await (await fetch("https://page.cau.edu.cn/repository/draftfiles_ajax.php?action=delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `sesskey=${sesskey}&client_id=${client_id}&filepath=%2F&itemid=${itemid}&filename=${encodeURIComponent(items[i].filename)}`
                })).json();
                console.log("Deleted: " + items[i].filename);
            }

            // 上传新文件
            var content = textarea.value;
            var type = config[select.value].type;
            var title = config[select.value].name;
            var formData = new FormData();
            formData.append("action", "upload");
            formData.append("repo_upload_file", new Blob([content], { type: type }), title);
            formData.append("sesskey", sesskey);
            formData.append("repo_id", 3);
            formData.append("itemid", itemid);
            formData.append("author", "");
            formData.append("savepath", "/");
            formData.append("title", title);
            json = await (await fetch("https://page.cau.edu.cn/repository/repository_ajax.php", {
                method: "POST",
                body: formData,
            })).json();
            console.log(json);

            var res = await fetch("https://page.cau.edu.cn/mod/assignment/type/onlinejudge/upload.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `contextid=${contextid}&userid=${userid}&action=uploadfile&sesskey=${sesskey}&_qf__mod_assignment_upload_form=1&files_filemanager=${files_filemanager}&submitbutton=%E4%BF%9D%E5%AD%98%E6%9B%B4%E6%94%B9`,
                redirect: "manual"
            });
            location.href = location.href;
            return;
        }

        newDiv.appendChild(innerDiv);
        newDiv.appendChild(textarea);
        newDiv.appendChild(newSubmit);
        main.appendChild(newDiv);
        // main.appendChild(oldE);
        clearInterval(E);
    }, 500);
    // Your code here...
})();
