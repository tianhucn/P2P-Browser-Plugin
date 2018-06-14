
var video;
// var hlsjsConfig;
// var p2pConfig;
// var hls;
// var p2pPlugin;

var network, nodes, edges;
var nodeIds;
var nodeInformation;

var cpm = {
    downloadresult: document.querySelectorAll('.cpm-downloadresult')[0],
    table: document.querySelectorAll('#table-body tbody')[0]
};
var addToTable = function (sn, url, level, downloaded, source) {
    console.log(cpm.table);
    console.log("sagasdg");
    cpm.table.innerHTML +=
        `<tr>
                    <td>${sn}</td>
                    <td>${url}</td>
                    <td>${level}</td>
                    <td>${downloaded}</td>
                    <td>${source}</td>
                </tr>`;
    if (!array_contain(nodeIds, sn)) {
        nodes.add({id: sn, label: String(sn)});
        nodeIds.push(sn);
        edges.add({from: sn, to: -1});
        nodeInformation [sn] = `<tr>
                    <td>${sn}</td>
                    <td>${url}</td>
                    <td>${level}</td>
                    <td>${downloaded}</td>
                    <td>${source}</td>
                </tr>`;
    }

    nodeInformation [sn] += `<tr>
                    <td>${sn}</td>
                    <td>${url}</td>
                    <td>${level}</td>
                    <td>${downloaded}</td>
                    <td>${source}</td>
                </tr>`;
};


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
        defaultUploadBW: 2557670/3*5,
//            transitionEnabled: true,
        transitionEnabled: false,
        transitionCheckInterval: 90
    };
    var hls = new Hls(hlsjsConfig);
    var p2pPlugin = new HlsPeerify(hls, p2pConfig);

    nodeIds = new Array();
    nodeInformation = {};
    createTopo();
    document.getElementById('node-info').innerHTML = "";
    cpm.table.innerHTML = "";

//        hls.loadSource('https://video-dev.github.io/streams/x36xhzz/x36xhzz.m3u8');
//        hls.loadSource('https://video-dev.github.io/streams/test_001/stream.m3u8');
    var videoURL = document.getElementById("videoURL").value;
    hls.loadSource(videoURL);
//        hls.loadSource('http://wowza.peer5.com/live/smil:bbb_abr.smil/chunklist_w794046364_b2204000.m3u8');
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
        hls.loadLevel = 0;
        video.play();
    });
    hls.on(Hls.Events.FRAG_LOADED, (id, data) => {
        var frag = data.frag;
//            console.warn(`sn ${frag.sn} relurl ${frag.relurl} level ${frag.level} downloaded ${frag.loaded} source ${frag.loadByXhr?'CDN':'P2P'}`);
        var source = frag.loadByXhr?'CDN':'P2P';
        addToTable(frag.sn, frag.relurl, frag.level, frag.loaded, source);
    });

    hls.on(Hls.Events.ERROR, function (event, data) {
        var errorType = data.type;
        var errorDetails = data.details;
        var errorFatal = data.fatal;
        console.warn('error details:'+errorDetails);
    });


}

function resetURL() {
    document.getElementById("videoURL").value = 'https://video-dev.github.io/streams/x36xhzz/x36xhzz.m3u8'
    playVideo();
}


function createTopo() {
    // create an array with nodes
    nodes = new vis.DataSet([
        {id: -1, label: 'Me', color: 'rgb(255,168,7)'},
    ]);
    nodeIds.push(-1);
    nodeInformation[-1] = 'This computer'
    // create an array with edges
    edges = new vis.DataSet([]);

    // create a network
    var container = document.getElementById('mynetwork');
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {
        autoResize: true,
        interaction: {hover: true}
    };
    network = new vis.Network(container, data, options);

    network.on("click", function (params) {
        // console.log(params.nodes);
        // console.log(nodeInformation[params.nodes]);
        if (nodeInformation[params.nodes] !== undefined) {
            document.getElementById('node-info').innerHTML = nodeInformation[params.nodes];
        }

    });
}

