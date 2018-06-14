/**
 * Created by xieting on 2018/2/28.
 */
import React, {Component} from 'react';
import Graph from './component/Graph';
import ReconnectingWebSocket from 'reconnecting-websocket';

class Topology extends Component {
    constructor() {
        super();
        this.nodeMap = new Map();             //id --> totalStreams
        this._setupStats();                   //周期性获取统计信息
        this.state = {};
        this.myurl = 'https://video-dev.github.io/streams/x36xhzz/x36xhzz.m3u8'
        this.topo(this.myurl);
    }

    topo(url1) {
        this.nodeMap = new Map();             //id --> totalStreams

        this._setupStats();                   //周期性获取统计信息

        this.state = {
            totalStreams: 0,
            graph: {
                nodes: [],
                edges: []
            },
            options: {
                layout: {
                    hierarchical: false
                },
                edges: {
                    color: "#000000",

                },
                nodes: {
                    shape: 'ellipse'
                },
            },
            events: {
                select: function (event) {
                    var {nodes, edges} = event;
                }
            },
            stats: {
                normalized: false,
                p2p: 0,
                source: 0,
                p2pBase: 0,
                sourceBase: 0,
            },
            p2pratio: 0,
            nodeinformation: {},
        };
        const wsOptions = {
            maxRetries: 5,
            minReconnectionDelay: 3 * 1000
        };
        const url = `ws://120.77.252.69:8080/vis?room=${encodeURIComponent(url1)}`;
        //const url =`ws://127.0.0.1:8080/vis?room=${encodeURIComponent('http://112.90.52.139/hls/pear.m3u8')}`;
        // const url =`ws://127.0.0.1:8080/vis?room=${encodeURIComponent('https://moeplayer.b0.upaiyun.com/dplayer/hls/hikarunara.m3u8')}`;
        let websocket = new ReconnectingWebSocket(url, undefined, wsOptions);
        this.websocket = websocket;
        websocket.onopen = () => {
            console.log('websocket connection opened with channel: ' + this.channel);
            let msg = {
                action: 'get_topology'
            };
            websocket.send(JSON.stringify(msg));
        };
        websocket.onmessage = (e) => {
            console.log(`websocket.onmessage ${e.data}`);
            const msg = JSON.parse(e.data);

            switch (msg.action) {
                case 'statistics': {
                    this._handleStat(msg);
                    break
                }
                case 'topology': {
                    let nodes = msg.nodes;
                    this.setState({p2pratio: msg.p2pratio});
                    this.state.totalStreams = msg.totalstreams;
                    this._initGraph(nodes);
                    break
                }
                case 'join': {
                    this._handleJoin(msg.node);
                    break
                }
                case 'leave': {
                    this._handleLeave(msg.node);
                    break
                }
                case 'connect': {
                    this._handleConn(msg.edge);
                    break
                }
                case 'disconnect': {
                    this._handleDisconn(msg.edge);
                    break
                }
                default:
            }
        };
    }

    changeUrl(e) {
        // this.state.stats.url = e.target.value;
        // this.topo(e.target.value)
        this.myurl = e.target.value;
    }

    confirm() {
        console.log(this.myurl);
        this.topo(this.myurl);
    }

    _handleStat(msg) {
        let result = msg.result;
        if (!this.state.stats.normalized) {
            this.setState({
                stats: {
                    p2pBase: result.p2p,
                    sourceBase: result.source,
                    normalized: true,
                    p2p: 0,
                    source: 0,
                }
            })
        }
        let newStats = Object.assign(this.state.stats, {
            p2p: result.p2p,
            source: result.source,
        });
        this.setState({
            stats: newStats
        })
    }

    _handleLeave(node) {
        let newNodes = [];
        for (let n of this.state.graph.nodes) {
            if (n.id === node.id) continue;
            newNodes.push(n);
        }
        this.setState({
            graph: {
                nodes: newNodes,
                edges: this.state.graph.edges
            }
        })
    }

    _handleJoin(node) {
        let info = node.info;
        // let label = `${info.country!='0'?info.country:''}${info.province!='0'?info.province:''}${info.city!='0'?info.city:''}${info.ISP!='0'?info.ISP:''}${node.id}`;
        //let label = `${node.id.substr(0,2)}(${Math.round(info.ul_bw/8/1024)}KB/s)`;
        let label = `${node.id.substr(0, 4)}`;
        // this.state.nodeinformation [node.id] = [info.ISP, info.Province, info.City];
        console.log([info.ISP, info.Province, info.City]);
        this.state.nodeinformation [node.id] = [info.ISP, info.Province, info.City, info.IP, Math.round(info.ul_bw / 8 / 1024) + "KB/s", info.UploadBW];
        this.setState({
            graph: {
                nodes: [
                    ...this.state.graph.nodes,
                    {
                        id: node.id,
                        label: label
                    }
                ],
                edges: [
                    ...this.state.graph.edges,
                    {
                        from: 0,
                        to: node.id,
                        label: this.state.totalStreams
                    }
                ]
            }
        })
    }

    _handleConn(edge) {
        this.nodeMap[edge.to] += edge.substreams;
        let remain = this.state.totalStreams - this.nodeMap[edge.to];
        let newEdges = [];
        if (remain === 0) {
            for (let e of this.state.graph.edges) {
                if (e.from === '0' && e.to === edge.to) continue
                newEdges.push(e);
            }
        } else {
            for (let e of this.state.graph.edges) {
                if (e.from === '0' && e.to === edge.to) {
                    e.label = remain + '';
                }
                newEdges.push(e);
            }
        }

        this.setState({
            graph: {
                nodes: this.state.graph.nodes,
                edges: [
                    ...newEdges,
                    {
                        from: edge.from,
                        to: edge.to,
                        length: Math.floor(Math.random() * (550 - 20 + 1)) + 120,
                        label: edge.substreams + ''
                    }
                ]
            }
        })
    }

    _handleDisconn(edge) {
        let newEdges = [];
        for (let e of this.state.graph.edges) {
            if (e.from === edge.from && e.to === edge.to) continue;
            newEdges.push(e);
        }
        this.setState({
            graph: {
                nodes: this.state.graph.nodes,
                edges: newEdges
            }
        })
    }

    _initGraph(newNodes) {
        let nodes = [{id: 0, label: 'Server', color: 'rgb(255,168,7)'}];
        this.state.nodeinformation [0] = ["Server"];
        let edges = [];
        for (let node of newNodes) {
            let info = node.info;
            // let label = `${info.country!='0'?info.country:''}${info.province!='0'?info.province:''}${info.city!='0'?info.city:''}${info.ISP!='0'?info.ISP:''}${node.id}`;
            //let label = `${node.id.substr(0,2)}(${Math.round(info.ul_bw/8/1024)}KB/s)`;
            // let label = `${node.id.substr(0, 4)}[${info.IP}](${Math.round(info.ul_bw / 8 / 1024)}KB/s)`;
            let label = `${node.id.substr(0, 4)}`;
            // console.log(info.ISP);
            nodes.push({
                id: node.id,
                label: label
            });
            // console.log(this.state);
            this.state.nodeinformation [node.id] = [info.ISP, info.province, info.city, info.IP, Math.round(info.ul_bw / 8 / 1024) + "KB/s", info.UploadBW];
            if (node.parents.length == 0) {
                edges.push({
                    from: 0,
                    to: node.id,
                    length: Math.floor(Math.random() * (550 - 20 + 1)) + 120,
                    label: this.state.totalStreams + ''
                })
            } else {
                let streamCount = 0;
                for (let parent of node.parents) {
                    edges.push({
                        from: parent.id,
                        to: node.id,
                        label: parent.substreams + ''
                    });
                    streamCount += parent.substreams;
                }
                if (streamCount < this.state.totalStreams) {
                    edges.push({
                        from: 0,
                        to: node.id,
                        length: Math.floor(Math.random() * (550 - 20 + 1)) + 120,
                        label: this.state.totalStreams - streamCount + ''
                    })
                }
                this.nodeMap[node.id] = streamCount;
            }
        }
        // this.state.graph.nodes = nodes
        // console.log(JSON.stringify({
        //     nodes: [
        //         ...nodes
        //     ],
        //     edges: [
        //         ...edges
        //     ]
        // },null,1));
        this.setState({
            graph: {
                nodes: [
                    ...nodes
                ],
                edges: [
                    ...edges
                ]
            }
        })
    }

    _setupStats() {
        setInterval(() => {

            let msg = {
                action: "get_stats"
            };
            if (this.websocket.readyState===1) {
                this.websocket.send(JSON.stringify(msg));
            }else{
                console.log("没有成功连接到websocket")
            }

        }, 30000)
    }

    render() {
        let inputstyle = {
            padding: '5px',
            border: '1px solid #E7EAEC',
            width: '500px',
            height: '20px',
            background: '#FAFAFB',
            borderRadius: '5px',
            color: '#474748',
            margin: '3px'
        };
        let buttonstyle = {
            padding: '5px',
            height: '30px',
            borderRadius: '5px',
            color: '#fdfdff',
            margin: '3px',
            border: '1px solid #7bb4ff',
            background: '#397dcc',
            hover: {
                background: '#7bb4ff'
            }
        };

        let mystyle = {
            padding: '6px',
            color: '#474748',
            border: '1px solid #E7EAEC',
            background: 'white',
            borderRadius: '5px',
            fontWeight: "600"
        };
        let headstyle = {
            background: '#222222',
            color: '#ba9444',
            padding: '20px',
            paddingLeft: '120px',
            textAlign: 'left'
        };
        let footstyle = {
            marginTop: '60px',
        background: '#333',
        color: '#eee',
        fontSize: '11px',
        padding: '20px',
        };
        let stats = this.state.stats;
        let p2p = stats.p2p - stats.p2pBase;
        let source = stats.source - stats.sourceBase;
        let p2pratio = this.state.p2pratio.toFixed(2);
        // let nodeinfo = this.nodeinformation;
        // let url = stats.url;
        return (

            <div>
                <header style={headstyle}>
                    <h1>P2P Topology Visual</h1>
                </header>
                <Graph style={{height: "640px"}} graph={this.state.graph} options={this.state.options}
                       events={this.state.events} nodeinfo={this.state.nodeinformation}/>
                <p><span style={mystyle}>p2p: {p2p}KB    source: {source}KB    P2Pratio: {p2pratio}%</span></p>
                <div>
                    <span style={mystyle}>视频URL</span>
                    <input type="text" id="videoURL" style={inputstyle} placeholder="请在此输入视频链接"
                           defaultValue={this.myurl} onChange={(e) => this.changeUrl(e)}/>
                    <button className="btn btn-primary" style={buttonstyle} type="button"
                            onClick={() => this.confirm()}>确定
                    </button>
                </div>
                <footer style={footstyle}>
                    <p>Project of Software Engineering, SUSTech. </p>
                    <p>Pear Limited.</p>
                </footer>
            </div>
        );
    }
}


export default Topology;
