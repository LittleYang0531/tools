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
var $_COOKIE = (function(){
	var strcookie = document.cookie;
    var arrcookie = strcookie.split(";"), dat=new Object();
    for ( var i = 0; i < arrcookie.length; i++) {
        var arr = arrcookie[i].split("=");
        dat[arr[0]]=arr[1];
		return dat;
    }
})();
function setCookie(cname,cvalue,exdays)
{
  	var d = new Date();	
	d.setTime(d.getTime()+exdays);
	var expires = "expires="+d.toGMTString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
}
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
function SendAjax(url,method,data,headers=headers) {
	var res;
	$.ajax({
		async:false,
		url:url,
		type:method,
		data:data,
		headers:headers,
		cache:false,
		processData:false,
		contentType:false,
		success:function(message) {
			console.log(message);
			res=message;
		},
		error:function(jqXHR,textStatus,errorThrown)
		{
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
	var obj=SendAjax(url,'GET',null);
	return obj;
}

// Get File's SHA from Github
function GetFileSHA(repo,path) {
	var url="https://api.github.com/repos/"+USER+"/"+repo+"/contents"+path;
	var sha=SendAjax(url,"GET",null);
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
				
		if (SendAjax(url,'PUT',data)!=null) alert("Upload Successfully!");
		else alert("Upload Failed!");
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

	static GetFile(repo,path) {
		var url="https://api.github.com/repos/"+USER+"/"+repo+"/contents"+path;
		
		var result="<h2><a href='//github.com/"+USER+"'>"+USER+"</a> / "+
		"<a href='//github.com/"+USER+"/"+repo+"'>"+repo+"</a> - "+path+"</h2>";
		
		var res=SendAjax(url,'GET',null);
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




// ****************************************************
// Class Name: GetBlogFromGithub
// Class Module: get
// Class Features: Get Blogs from the Github
// ****************************************************

class GetBlogFromGithub {
	static GetContent(id) {
		var url="https://api.github.com/repos/"+USER+"/"+BLOG_REPO+"/issues/"+id;

		var res=SendAjax(url,"GET",null);
		return Mdjs.md2html(res["body"]);
	}

	static GetBlog(id) {
		if (id!=undefined) return GetBlogFromGithub.GetContent(id);
		var url="https://api.github.com/repos/"+USER+"/"+BLOG_REPO+"/issues";
		
		var res=SendAjax(url,"GET",null);
		var result="";
		for (var i=0;i<res.length;i++) {
			result+="<p><a href=\"getblog.html?id="+res[i]["number"]+"\">"+res[i]["title"]+"</a></p>";
		}
		return result;
	}
}




// ****************************************************
// Class Name: UploadBlogGithub
// Class Module: upload
// Class Features: Upload Blog to the Github
// ****************************************************

class UploadBlogGithub {
	static GetText() {
		var res="<div id='layout'>"+
		"<input type='text' id='title' class='title'>"+
		"<div id='editormd'>"+
			"<textarea style='display:none'></textarea>"+
		"</div></div>"+
		"<button onclick='UploadBlogGithub.UploadBlog()'>Submit</button>";
		return res;
	}

	static CreateEditor() {
		var editor=editormd("editormd",{
			width:"100%",
			height:"800px",
			path:"./extension/editor.md/lib/",
		});
	}

	static UploadBlog() {
		var content=$("#editormd > textarea")[0].innerHTML;
		var url="https://api.github.com/repos/"+USER+"/"+BLOG_REPO+"/issues";
		var data={title:$("#title")[0].value,body:content};
		data=JSON.stringify(data);
		if (!SendAjax(url,"POST",data)) alert("Upload Failed!");
		else alert("Upload Successfully!");
	}
}




// ****************************************************
// Class Name: DeleteBlogGithub
// Class Module: delete
// Class Features: Delete Blog from the Github
// ****************************************************

// Warning: This feature isn't found on the Github's API
// Please do not use this feature or your application will have some problem
class DeleteBlogGithub {
	static GetText() {
		var res="<select id='issues'>";
		var url="https://api.github.com/repos/"+USER+"/"+BLOG_REPO+"/issues";
		var data=SendAjax(url,"GET",null);
		for (var i=0;i<data.length;i++) {
			res+="<option value='"+data[i]["number"]+"'>"+data[i]["title"]+"</option>";
		}
		res+="</select><button onclick='DeleteBlogGithub.DeleteBlog()'>Submit</button>";
		return res;
	}

	static DeleteBlog() {
		var id=document.getElementById("issues").value;
		var url="https://api.github.com/repos/"+USER+"/"+BLOG_REPO+"/issues/"+id;
		if (!SendAjax(url,"DELETE",null)) alert("Delete Failed!");
		else alert("Delete Successfully!");
	}
}





// ****************************************************
// Class Name: LoginGithub
// Class Module: login
// Class Features: Get Login Info from Github
// ****************************************************
class LoginGithub {
	static LoginProcess() {
		var url="https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token?client_id="+client_id+"&client_secret="+client_secret+"&code="+$_GET["code"]+"";
		var content=SendAjax(url,"GET",null,{Accept:"application/json"});
		if (content==null) {
			alert("获取用户令牌失败!");
			return false;
		}
		setCookie("access_token",content["access_token"],30*24*60*60);
		// console.log(content["access_token"]);
		location.replace(window.location.href.split('?')[0]);
	}

	static LoginModule() {
		var url="https://github.com/login/oauth/authorize?client_id="+client_id+"&scope=user";
		location.replace(url);
		return false;
	}

	static Login() {
		if ($_GET["code"]!=undefined&&$_COOKIE["access_token"]==undefined) this.LoginProcess();
		else if ($_COOKIE["access_token"]!=undefined) return true;
		else this.LoginModule();
	}

	static CheckAuthor() {
		var url="https://api.github.com/user";
        var header={"Authorization":'token '+$_COOKIE["access_token"]};
        var loginname=SendAjax(url,"GET",null,header);
        if (loginname==null) {
            setCookie("access_token","",-100);
            location.replace(window.location.href.split('?')[0]);
        }loginname=loginname["login"];
        var header={"Authorization":'token '+TOKEN};
        var adminname=SendAjax(url,"GET",null,header)["login"];
        return {login:loginname,admin:adminname};
	}

	static Logout() {
		setCookie("access_token","",-100);
		location.replace(window.location.href.split('?')[0]);
	}

	static CheckLoginState() {
		if ($_COOKIE["access_token"]==undefined) return false;
		var url="https://api.github.com/user";
        var header={"Authorization":'token '+$_COOKIE["access_token"]};
        var loginname=SendAjax(url,"GET",null,header);
        if (loginname==null) {
            setCookie("access_token","",-100);
            return false;
        }
		return true;
	}
}