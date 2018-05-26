
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

    player = videojs('#player', {
        autoplay: true,
        html5: {
            hlsjsConfig: {
//                maxBufferSize: 0,
//                maxBufferLength: 30,
                liveSyncDurationCount: 10,
//                liveSyncDurationCount: 5,
                fragLoadingTimeOut: 4000,              // used by fragment-loader
            }
        }
    });

    p2pConfig = {
        key: 'free',
        wsSchedulerAddr: `ws://10.21.100.172:8080/ws`,
        wsSignalerAddr: 'ws://120.78.168.126:8081/ws',
        reportInterval: 30,
        defaultUploadBW: 2557670/3*5,
        transitionEnabled: false,
        transitionCheckInterval: 90
    };

    // hlsjsConfig.p2pConfig = p2pConfig;
    playVideo();

}


function playVideo() {
    nodeIds = new Array();
    nodeInformation = {};
    createTopo();
    document.getElementById('node-info').innerHTML = "";
    var videoURL = document.getElementById("videoURL").value;
    document.getElementById("videoSource").setAttribute("src",videoURL)


    new HlsPeerify(player.tech_.sourceHandler_.hls, p2pConfig);

    player.tech_.on(Hls.Events.MANIFEST_LOADED, function (e) {
        cpm.downloadresult.classList.remove('sr-only');
    });

    player.tech_.on(Hls.Events.FRAG_LOADED, function (e, data) {
        var frag = data.frag;
//            console.warn(`sn ${frag.sn} relurl ${frag.relurl} level ${frag.level} downloaded ${frag.loaded} source ${frag.loadByXhr?'CDN':'P2P'}`);
        var source = frag.loadByXhr?'CDN':'P2P';
        addToTable(frag.sn, frag.relurl, frag.level, frag.loaded, source);
    });

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

