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

var headers=
{
	"Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Language":"zh-CN,en-US;q=0.7,en;q=0.3",
	"Authorization":'token '+TOKEN,
}

function getsize(filesize) {
	var output_filesize;
	if (filesize<2048) output_filesize=filesize+" Byte";
	else if (filesize<2*1024*1024) output_filesize=(filesize/1024).toFixed(2)+" KB";
	else if (filesize<2*1024*1024*1024) output_filesize=(filesize/1024/1024).toFixed(2)+" MB";
	else output_filesize=(filesize/1024/1024/1024).toFixed(2)+" GB";
	return output_filesize;
}
function getfile(repo,path) {
	var url="https://api.github.com/repos/"+USER+"/"+repo+"/contents"+path;
	
	var result=
	"<h2><a href='//github.com/"+USER+"'>"+USER+
	"</a> / <a href='//github.com/"+USER+"/"+repo+"'>"+repo+"</a> - "+path+"</h2>";
	
	$.ajax({
		url: url,
		type: 'GET',
		headers: headers,
		cache: false,
		async: false,
		processData: false,
		contentType: false,
		success:function(message) {
			console.log(message);
			for (var i=0;i<message.length;i++) {
				if (message[i]["type"]=="dir") {
					result+="<div class='dir'>"+
						"<a href='getfile.html?repo="+repo+"&path=/"+message[i]["path"]+"/' class='dirname'>"+message[i]["name"]+"</a>"+
					"</div>";
				} else if (message[i]["type"]=="file") {
					result+="<div class='file'>"+
						"<a href='https://cdn.jsdelivr.net/gh/"+USER+"/"+repo+"/"+message[i]["path"]+"' class='filename'>"+message[i]["name"]+"</a>"+
						"<a href='"+message[i]["download_url"]+"' class='download'>direct link</a>"+
						"<p class='filesize'>"+getsize(message[i]["size"])+"</p>"+
					"</div>";
				}
			}
			console.log(result);
			return result;
		},
		error:function(jqXHR,textStatus,errorThrown)
		{
		    console.log(jqXHR.responseText);
		    console.log(jqXHR.status);
		    console.log(jqXHR.readyState);
		    console.log(jqXHR.statusText);
		    console.log(textStatus);
		    console.log(errorThrown);
			return result;
		}
	});
	return result;
}