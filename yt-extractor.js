// ==UserScript==
// @name         yt-extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/watch?v=*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_setClipboard
// ==/UserScript==

// criar uma caixa pra exibir as legendas enquanto o video avança
// fazer com oque o script funcione em todos os videos novos que sejam abertos
// seleção de legendas
// opção pra desabilitar interface do player de video do youtube

async function make_request(url) {
    const response = await fetch(url); 
    if (!response.ok) { 
	throw new Error(response.statusText);
    }
    return response.text();
} 

//https://github.com/kyamashiro/youtube-subtitle-download-helper
//funciona por enquanto
function parse_request(html) {
    const captions = /\{"captionTracks":(\[.*?\]),/g.exec(html); 
    if (!captions) {
	throw new Error("parse_request");
    }
    return JSON.parse(captions[1]);
}
function wait_element(selector) { 
    return new Promise(resolve => {
	if (document.querySelector(selector)){
	    return resolve(document.querySelector(selector));
	}
	const observer = new MutationObserver(mutations => {
	    if (document.querySelector(selector)){
		resolve(document.querySelector(selector));
		observer.disconnect();
	    }
	});
	observer.observe(document.body, {
	    childList: true,
	    subtree: true
	});
    });

} 
(function() {
    'use strict'; 
    let default_lang = "ja";

    make_request(document.URL)
	.then(request => { 
	    let i = parse_request(request); 
	    i = i.find(sub => sub.languageCode == default_lang);

	    //console.log(i);
	    return make_request(i.baseUrl)})
	.then(xml_string => { 
	    let xml = new DOMParser().parseFromString(xml_string, "text/xml"),
		subs = Array.from(xml.querySelector("transcript").children);
	    console.log(xml);

	    wait_element("video")
		.then(video => {
		    let last_sub = null;
		    let display_subtitle = function () {
			let current = null; 
			// legendas geradas pelo youtube tendem sobrepor umas as outras
			for (var i = subs.length - 1; i >= 0; i--){ //FIXME: qualquer coisa alem de linear search por favor
			    let start = parseInt(subs[i].getAttribute("start"));
			    let end = start + parseInt(subs[i].getAttribute("dur"));

			    if (start <= video.currentTime && video.currentTime <= end){
				current = subs[i];
				break; 
			    }
			}
			if (current != null && current.textContent != last_sub)
			{ 
			    GM_setClipboard (current.textContent);
			    console.log(current.textContent);
			    last_sub = current.textContent;
			}
		    }

		    video.ontimeupdate = display_subtitle; 
		});
	}).catch(error => console.log(error)); 

    wait_element("#secondary-inner")
	.then(secondary => {
	    let teste = document.createElement("h3");
	    teste.setAttribute("class", "style-scope ytd-compact-video-renderer");
	    teste.setAttribute("id", "video-title");
	    teste.appendChild(document.createTextNode("yt-extractor v0.1"));
	    secondary.insertBefore(teste, secondary.children[0]); 
	}).catch(error => console.log(error));


    // https://stackoverflow.com/a/46924698
})();
