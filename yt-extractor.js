// ==UserScript==
// @name         yt-extractor
// @version      1.0
// @description  try to take over the world!
// @match        https://www.youtube.com/watch?v=*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_setClipboard
// ==/UserScript==

// todo:
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
	    // as legendas de um video do youtube vem de uma api diferente da api padrão que o google disponibiliza
	    // o html da pagina inclui uma ou mais URLs apontando pras legendas formatadas em xml 
	    // https://github.com/kyamashiro/youtube-subtitle-download-helper/blob/1b163e0da317e6839512812e82af6818d4875c2c/src/parser/videoInformationParser.ts#L4

	    let subs = parse_request(request); 

	    let ret = subs.find(sub => sub.languageCode == default_lang); // selecionar legenda padrão
	    if (ret == null)
		ret = subs[0];

	    return make_request(ret.baseUrl)})
	.then(xml_string => { 
	    let xml = new DOMParser().parseFromString(xml_string, "text/xml"),
		subs = Array.from(xml.querySelector("transcript").children);

	    wait_element("video")
		.then(video => {
		    let last_sub = null;
		    let display_subtitle = function () {
			let current = null; 
			// legendas geradas pelo youtube tendem sobrepor umas as outras
			// iterar do inicio até o fim as vezes ignora legendas sendo sobrepostas por outra legenda
			for (var i = subs.length - 1; i >= 0; i--){ // iterar do fim até o inicio
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

    // todo
    wait_element("#secondary-inner")
	.then(secondary => {
	    let teste = document.createElement("h3");
	    teste.setAttribute("class", "style-scope ytd-compact-video-renderer");
	    teste.setAttribute("id", "video-title");
	    teste.appendChild(document.createTextNode("yt-extractor v0.1"));
	    secondary.insertBefore(teste, secondary.children[0]); 
	}).catch(error => console.log(error));


})();
