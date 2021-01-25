const Discord = require("discord.js");
const Store = require('data-store');
var ids = (!!process.env.ACCOUNTS) ? process.env.ACCOUNTS.split(",") : ["monkeegfx", "instagram"];
const config = require('./config');
var ci = require('correcting-interval');
var moment = require('moment');
var Axios = require('axios');
const current = new Store({ path: 'data/current.json' });
var Hook = [];
config.discord.webhookURL.forEach(function(webhk){
  Hook.push(new Discord.WebhookClient(webhk.id, webhk.token))
});

const https = require('https');

config.instagramAccounts.forEach(function (user){

	url0 ='https://graph.instagram.com/'+user.userId+'/media?access_token='+user.access_token+"/";

	https.get(url0,(res) => {


		res.on("data",(data) =>{


			var str = data.toString();

			var d = str.substring(str.indexOf("id"),str.indexOf('"}],"paging"'));
			var arr = getIds(d);
			var i = 0;
			arr.forEach((id)=> {

				photoInfoUrl = "https://graph.instagram.com/"+id.toString()+"?fields=id,media_type,media_url,username,timestamp&access_token="+user.access_token;
				https.get(photoInfoUrl,(resp)=>{
					resp.on("data", (info)=>{
						//console.log(info.toString());
						console.log("..............................................................")
						var j = JSON.parse(info.toString());
						console.log(j);
					});

				}).on("error", (e) => {
					console.error(e);
				});

				i++;
			});


		});
	}).on('error', (e) => {
		console.error(e);
	});

});
function getIds(data){
	var str =data.toString();
	var arr = [];
	var i = 0
	while(str.length!=0){
		str = str.substring(str.indexOf(":")+2 , str.length);
		arr[i] = str.substring(0, 17);
		i++;
		if(str.indexOf(":")==-1){
			break;
		}
	}
	return arr;
}


ci.setCorrectingInterval(function() {
  	ids.forEach(function(user){
  		var id = user.replace(/\r?\n|\r/g, "");
  		Axios.get('https://www.instagram.com/'+id+'/').then(data => {
	  		const jsonObject = data.data.match(/<script type="text\/javascript">window\._sharedData = (.*)<\/script>/)[1].slice(0, -1);
	  		var info = JSON.parse(jsonObject);
	  		if(info.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges[0]!==undefined){
		  		var latest = info.entry_data.ProfilePage[0].graphql.user.edge_owner_to_timeline_media.edges[0].node;
		  		if(latest!==undefined){
		  			var caption = 'No caption.';
		  			if(latest.edge_media_to_caption.edges[0]!==undefined){caption=latest.edge_media_to_caption.edges[0].node.text}
			  		if(current.hasOwn(id)===true){
			  			var curid = current.get(id);
			  			if(curid!==latest.id){
			  				current.set(id, latest.id);
			  				postToWebhook(id, 'https://www.instagram.com/'+id+'/', latest.display_url, caption)
			  			}
			  		}else{
			  			current.set(id, latest.id);
			  			postToWebhook(id, 'https://www.instagram.com/'+id+'/', latest.display_url, caption)
			  		}
			  	}
			}
	  	})
  	})
}, 3000);

function postToWebhook(id, url, img, caption){
  const embed = {
    "title": (!!process.env.TITLE) ? process.env.TITLE + id : id+' posted:' ,
    "description": caption,
    "url": url,
    "footer": {
    	"text": (!!process.env.FOOTERTEXT) ? process.env.FOOTERTEXT : moment().locale((!!process.env.LOCALE) ? process.env.LOCALE : 'en').format((!!process.env.DATEFORMAT) ? process.env.DATEFORMAT : "dddd, MMMM Do YYYY, h:mm:ss a")
    }
  };
  console.log("posted to discord: ", caption);
  if(img!==undefined&&img!==null){embed.image= {"url": img}}
  Hook.forEach(function(hook){
    hook.send({embeds: [embed]});
  })
}
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
