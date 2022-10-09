var $_GET = (function(){
	var url = window.document.location.href.toString();
	var u = url.split("?");
	if(typeof(u[1]) == "string"){
		u = u[1].split("&");
		var get = {};
		for(var i in u){
			var j = u[i].split("=");
			get[j[0]] = j[1];
		}
		return get;
	} else {
		return {};
	}
})();
var headers= {
	"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Language":"zh-CN,en-US;q=0.7,en;q=0.3",
	"Authorization":'token '+TOKEN,
}




// ****************************************************
// Class Name: None
// Class Module: None
// Class Features: Single Functions
// ****************************************************

// Send Ajax Request
function SendAjax(url,method,data,async,callback) {
	var res;
	$.ajax({
		async:async,
		url:url,
		type:method,
		data:data,
		headers:headers,
		cache:false,
		processData:false,
		contentType:false,
		success:function(message) {
			callback();
			console.log(message);
			res=message;
		}, 
		error:function(jqXHR,textStatus,errorThrown)
		{
			alert("Failed to fetch data! url: " + url);
			console.log(jqXHR.responseText);
			console.log(jqXHR.status);
			console.log(jqXHR.readyState);
			console.log(jqXHR.statusText);
			console.log(textStatus);
			console.log(errorThrown);
			res=null;
		}
	});
	return res;
}

// Get Repositories under the USER
function GetRepos() {
	var url="https://api.github.com/users/"+USER+"/repos";
	var obj=SendAjax(url,'GET',null,false);
	return obj;
}

// Get File's SHA from Github
function GetFileSHA(repo,path) {
	var url="https://api.github.com/repos/"+USER+"/"+repo+"/contents"+path;
	var sha=SendAjax(url,"GET",null,false);
	return sha==null?null:sha["sha"];
}



// ****************************************************
// Class Name: UploadGithub
// Class Module: upload
// Class Features: Upload Files to the Github
// ****************************************************

class UploadGithub {
	static GetText() {
		var res="<select id=\"repo\">";
		var repos=GetRepos();
		for (var i=0;i<repos.length;i++) {
			res+="<option value=\""+repos[i]["name"]+"\">"+repos[i]["name"]+"</option>";
		}
		res+="</select>"+
		"<input type=\"file\" id=\"file\" name=\"file\">"+
		"<input type=\"text\" id=\"path\" name=\"path\">"+
		"<button onclick=\"UploadGithub.ReadFile()\">提交</button>";
		return res;
	}

	static ReadFile() {
		var input=document.getElementById("file");
		if (typeof(FileReader)==='undefined') {
			result.innerHTML="抱歉，你的浏览器不支持FileReader！";
			input.setAttribute('disabled','disabled');
		} 
		var reader = new FileReader();
		reader.readAsDataURL(input.files[0]);
		reader.onload = function() { 
		    UploadGithub.UploadFile(this.result);
		}
	}

	static UploadFile(content) {
		var path=document.getElementById("path").value;
		var repo=document.getElementById("repo").value;
		var url="https://api.github.com/repos/"+USER+"/"+repo+"/contents"+path;
				
		var data={message:"Upload By "+USER,committer:{name:USER,email:MAIL},content:(content.split(","))[1]};
		data=JSON.stringify(data);
				
		SendAjax(url,'PUT',data,true,function(){alert("Upload Successfully!");});
	}

	static CreateFile(repo,path) {
		var url="https://api.github.com/repos/"+USER+"/"+repo+"/contents"+path;
				
		var data={message:"Upload By "+USER,committer:{name:USER,email:MAIL},content:""};
		data=JSON.stringify(data);

		SendAjax(url,'PUT',data,true,function(){alert("Create Successfully!");});
	}

	static UploadFile(content,repo,path) {
		var url="https://api.github.com/repos/"+USER+"/"+repo+"/contents"+path;
				
		var data={message:"Upload By "+USER,committer:{name:USER,email:MAIL},content:content,sha:GetFileSHA(repo,path)};
		data=JSON.stringify(data);
		
		SendAjax(url,'PUT',data,true,function(){alert("Upload Successfully!");});
	}
}




// ****************************************************
// Class Name: DeleteGithub
// Class Module: delete
// Class Features: Delete Files from the Github
// ****************************************************

class DeleteGithub {
	static GetText() {
		var res="<select id=\"repo\">";
		var repos=GetRepos();
		for (var i=0;i<repos.length;i++) {
			res+="<option value=\""+repos[i]["name"]+"\">"+repos[i]["name"]+"</option>";
		}
		res+="</select>"+
		"<input type=\"text\" id=\"path\" name=\"path\">"+
		"<button onclick=\"DeleteGithub.DeleteFile()\">提交</button>";
		return res;
	}

	static DeleteFile() {
		var repo=document.getElementById("repo").value;
		var path=document.getElementById("path").value;
		var sha=GetFileSHA(repo,path);
		console.log(sha);
		if (sha==null) {
			alert("File not Exist!");
			return false;
		}

		var url="https://api.github.com/repos/"+USER+"/"+repo+"/contents"+path;
		var data={message:"Delete By "+USER,committer:{name:USER,email:MAIL},sha:sha};
		data=JSON.stringify(data);

		if (SendAjax(url,"DELETE",data)==null) alert("Delete Failed!");
		else alert("Delete Successfully!");
	}
}






// ****************************************************
// Class Name: GetFromGithub
// Class Module: get
// Class Features: Get Files or Directories from the Github
// ****************************************************

class GetFromGithub {
	static GetSize(filesize) {
		var output_filesize;
		if (filesize<2048) output_filesize=filesize+" Byte";
		else if (filesize<2*1024*1024) output_filesize=(filesize/1024).toFixed(2)+" KB";
		else if (filesize<2*1024*1024*1024) output_filesize=(filesize/1024/1024).toFixed(2)+" MB";
		else output_filesize=(filesize/1024/1024/1024).toFixed(2)+" GB";
		return output_filesize;
	}

	static GetFileArrayFull(repo) {
		var url="https://api.github.com/repos/"+USER+"/"+repo+"/git/trees/"+BRANCH+"?recursive=1";
		return SendAjax(url,'GET',null,false);
	}
	static GetFile(repo,path) {
		var url="https://api.github.com/repos/"+USER+"/"+repo+"/contents"+path;
		
		var result="<h2><a href='//github.com/"+USER+"'>"+USER+"</a> / "+
		"<a href='//github.com/"+USER+"/"+repo+"'>"+repo+"</a> - "+path+"</h2>";
		
		var res=SendAjax(url,'GET',null,false);
		console.log(res);
		if (res==null) return alert("Get File Failed!"),result;
		for (var i=0;i<res.length;i++) {
			if (res[i]["type"]=="dir") {
				result+="<div class='dir'>"+
					"<a href='getfile.html?repo="+repo+"&path=/"+res[i]["path"]+"/' class='dirname'>"+
					res[i]["name"]+"</a>"+
				"</div>";
			} else if (res[i]["type"]=="file") {
				result+="<div class='file'>"+
					"<a href='https://cdn.jsdelivr.net/gh/"+USER+"/"+repo+"/"+res[i]["path"]+"' class='filename'>"+res[i]["name"]+"</a>"+
					"<a href='"+res[i]["download_url"]+"' class='download'>direct link</a>"+
					"<p class='filesize'>"+this.GetSize(res[i]["size"])+"</p>"+
				"</div>";
			}
		}
		return result;
	}
}
