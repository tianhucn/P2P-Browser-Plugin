// import * as ReactDOM from "element-react";

var video;
// var hlsjsConfig;
// var p2pConfig;
// var hls;
// var p2pPlugin;
var p2pcount=0;
var cdncount=0;
var cubeIds;
var cubeInformation;

var cpm = {
    downloadresult: document.querySelectorAll('.cpm-downloadresult')[0],
    table: document.querySelectorAll('#table-body tbody')[0]
};
var addToTable = function (sn, url, level, downloaded, source) {
    var cubediv = document.getElementById("cube-div");
    cpm.table.innerHTML +=
        `<tr>
                    <td>${sn}</td>
                    <td>${url}</td>  
                    <td>${level}</td>
                    <td>${downloaded}</td>
                    <td>${source}</td>
                </tr>`;
    if (!array_contain(cubeIds, sn)) {
        var cube_class;
        if (source === "P2P") {
            cube_class = "cube-p2p";
            p2pcount++;
        } else if (source === "CDN") {
            cube_class = "cube-cdn";
            cdncount++;
        } else {
            cube_class = "cube-other";
        }

        cubeIds.push(sn);
        cubeInformation [sn] = `<tr>
                    <td>${sn}</td>
                    <td>${url}</td>
                    <td>${level}</td>
                    <td>${downloaded}</td>
                    <td>${source}</td>
                </tr>`;
    } else {
        cubeInformation [sn] += `<tr>
                    <td>${sn}</td>
                    <td>${url}</td>
                    <td>${level}</td>
                    <td>${downloaded}</td>
                    <td>${source}</td>
                </tr>`;
    }
    document.getElementById("p2pRatio").innerText = ((p2pcount/(p2pcount+cdncount))*100).toFixed(2)+"%";
    var acube = document.createElement("div");
    acube.className = "col-md-1";
    acube.innerHTML = "<button class=\"btn " + cube_class + " btn-default\" onclick='click_cube(this)'>" + sn + "</button>";
    // "<div class=\"col-md-1 " + "\" ></div>"
    cubediv.appendChild(acube);

};

function click_cube(that) {
    var key = that.innerText;
    console.log(key);
    if (cubeInformation[key] !== undefined) {
        document.getElementById('node-info').innerHTML = cubeInformation[key];
    }
}


function array_contain(array, obj) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === obj)//如果要求数据类型也一致，这里可使用恒等号===
            return true;
    }
    return false;
}

//controller
console.log('hls.js version: ' + Hls.version);
console.log('p2p plugin version: ' + Hls.pluginVersion);


if (Hls.isSupported()) {

    playVideo();

//        hls.disableP2P();
//
//        setTimeout(function () {
//            hls.enableP2P();
//        }, 10000)
}


function playVideo() {
    video = document.getElementById('video');

    var hlsjsConfig = {
//        debug: true,
//      pLoader : pLoader,
        liveSyncDuration: 60,
        fragLoadingTimeOut: 4000,
    };

    var p2pConfig = {
        key: 'free',
        wsSchedulerAddr: `ws://120.77.252.69:8080/ws`,
        wsSignalerAddr: 'ws://120.78.168.126:8081/ws',
        reportInterval: 30,
//            defaultUploadBW: 2561241,
//            defaultUploadBW: 2561241 + 100,
//            defaultUploadBW: 853290*3+1000,
        defaultUploadBW: 2557670 / 3 * 5,
//            transitionEnabled: true,
        transitionEnabled: false,
        transitionCheckInterval: 90
    };
    var hls = new Hls(hlsjsConfig);
    var p2pPlugin = new HlsPeerify(hls, p2pConfig);

    cubeIds = new Array();
    cubeInformation = {};
    // createTopo();
    document.getElementById('node-info').innerHTML = "";
    document.getElementById('cube-div').innerHTML = "";
    cpm.table.innerHTML = "";

    var videoURL = document.getElementById("videoURL").value;
    hls.loadSource(videoURL);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
        hls.loadLevel = 0;
        video.play();
    });
    hls.on(Hls.Events.FRAG_LOADED, (id, data) => {
        var frag = data.frag;
        var source = frag.loadByXhr ? 'CDN' : 'P2P';
        addToTable(frag.sn, frag.relurl, frag.level, frag.loaded, source);
    });

    hls.on(Hls.Events.ERROR, function (event, data) {
        var errorType = data.type;
        var errorDetails = data.details;
        var errorFatal = data.fatal;
        console.warn('error details:' + errorDetails);
    });


}

function resetURL() {
    document.getElementById("videoURL").value = 'https://video-dev.github.io/streams/x36xhzz/x36xhzz.m3u8'
    playVideo();
}


