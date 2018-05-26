var video;
var hlsjsConfig;
var p2pConfig;

var network, nodes, edges;
var nodeIds;
var nodeInformation;

var cpm = {
    downloadresult: document.querySelectorAll('.cpm-downloadresult')[0],
    table: document.querySelectorAll('#table-body tbody')[0]
};
var addToTable = function (sn, url, level, downloaded, source) {
    // cpm.table.innerHTML +=
    //     `<tr>
    //                 <td>${sn}</td>
    //                 <td>${url}</td>
    //                 <td>${level}</td>
    //                 <td>${downloaded}</td>
    //                 <td>${source}</td>
    //             </tr>`;
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
    video = document.getElementById('video');

    hlsjsConfig = {
//        debug: true,
//      pLoader : pLoader,
        maxBufferSize: 0,
    };

    p2pConfig = {
        debug: true,
//            websocketAddr: 'ws://120.78.168.126:3389',
        websocketAddr: 'ws://localhost:3389',
        reportInterval: 36000,
        p2pEnabled: true
    };

    hlsjsConfig.p2pConfig = p2pConfig;
    playVideo();

//        hls.disableP2P();
//
//        setTimeout(function () {
//            hls.enableP2P();
//        }, 10000)
}


function playVideo() {
    nodeIds = new Array();
    nodeInformation = {};
    createTopo();
    document.getElementById('node-info').innerHTML = "";
    // cpm.table.innerHTML = ""
    var hls = new Hls(hlsjsConfig);
//        hls.loadSource('https://video-dev.github.io/streams/x36xhzz/x36xhzz.m3u8');
//        hls.loadSource('https://video-dev.github.io/streams/test_001/stream.m3u8');
    var videoURL = document.getElementById("videoURL").value;
    hls.loadSource(videoURL);
//        hls.loadSource('http://wowza.peer5.com/live/smil:bbb_abr.smil/chunklist_w794046364_b2204000.m3u8');
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
        hls.loadLevel = 0;
        video.play();
        cpm.downloadresult.classList.remove('sr-only');
    });
    hls.on(Hls.Events.FRAG_LOADED, (id, data) => {

        var frag = data.frag;
//            console.warn(JSON.stringify(data.frag));
//            console.warn(`sn ${frag.sn} relurl ${frag.relurl} level ${frag.level} downloaded ${frag.loaded} source ${frag.loadByXhr?'CDN':'P2P'}`);
        var source = frag.loadByXhr ? 'CDN' : 'P2P';
        addToTable(frag.sn, frag.relurl, frag.level, frag.loaded, source);
    });

    hls.on(Hls.Events.ERROR, function (event, data) {
        var errorType = data.type;
        var errorDetails = data.details;
        var errorFatal = data.fatal;
        console.warn('warn details:' + errorDetails);
//      switch(data.details) {
//        case hls.ErrorDetails.FRAG_LOAD_ERROR:
//          // ....
//          break;
//        default:
//          break;
//      }
    });
    // var p2pPlugin = new HlsPeerify(hls, p2pConfig);
    // p2pPlugin.enableP2P();
    // p2pPlugin._init(videoURL);

}

function resetURL() {
    document.getElementById("videoURL").value = '//bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
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

