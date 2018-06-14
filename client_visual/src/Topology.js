/**
 * Created by xieting on 2018/2/28.
 */
import React, { Component } from 'react';
import Graph from './component/Graph';
import ReconnectingWebSocket from 'reconnecting-websocket';

class Topology extends Component {
    constructor() {
        super();
        this.nodeMap = new Map();             //id --> totalStreams

        this._setupStats();                   //周期性获取统计信息

        this.state = {
            totalStreams: 0,
            graph: {
                nodes:[],
                edges: []
            },
            options: {
                physics: false,
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
                select: function(event) {
                    var { nodes, edges } = event;
                }
            },
            stats: {
                normalized: false,
                p2p: 0,
                source: 0,
                p2pBase: 0,
                sourceBase: 0,
        }
        };
        const wsOptions = {
            maxRetries: 5,
            minReconnectionDelay: 3*1000

        };
        const url =`ws://127.0.0.1:8080/vis?room=${encodeURIComponent('https://video-dev.github.io/streams/x36xhzz/x36xhzz.m3u8')}`;
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
                case 'statistics':
                {
                    this._handleStat(msg);
                    break
                }
                case 'topology':
                {
                    let nodes = msg.nodes;
                    this.state.totalStreams = msg.totalstreams;
                    this._initGraph(nodes);
                    break
                }
                case 'join':
                {
                    this._handleJoin(msg.node);
                    break
                }
                case 'leave':
                {
                    this._handleLeave(msg.node);
                    break
                }
                case 'connect':
                {
                    this._handleConn(msg.edge);
                    break
                }
                case 'disconnect':
                {
                    this._handleDisconn(msg.edge);
                    break
                }
                default:
            }
        };
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
        })
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
        let label = `${node.id.substr(0,4)}[${info.IP}](${Math.round(info.ul_bw/8/1024)}KB/s)`;
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
            if (e.from === edge.from && e.to === edge.to) continue
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
        let nodes = [{id: 0, label: 'Server'}];
        let edges = [];
        for (let node of newNodes) {
            let info = node.info;
            // let label = `${info.country!='0'?info.country:''}${info.province!='0'?info.province:''}${info.city!='0'?info.city:''}${info.ISP!='0'?info.ISP:''}${node.id}`;
            //let label = `${node.id.substr(0,2)}(${Math.round(info.ul_bw/8/1024)}KB/s)`;
            let label = `${node.id.substr(0,4)}[${info.IP}](${Math.round(info.ul_bw/8/1024)}KB/s)`;
            nodes.push({
                id: node.id,
                label: label
            })

            if (node.parents.length == 0) {
                edges.push({
                    from: 0,
                    to: node.id,
                    length: Math.floor(Math.random() * (550 - 20 + 1)) + 120,
                    label: this.state.totalStreams +''
                })
            } else {
                let streamCount = 0;
                for (let parent of node.parents) {
                    edges.push({
                        from: parent.id,
                        to: node.id,
                        label: parent.substreams + ''
                    })
                    streamCount += parent.substreams;
                }
                if (streamCount < this.state.totalStreams) {
                    edges.push({
                        from: 0,
                        to: node.id,
                        length: Math.floor(Math.random() * (550 - 20 + 1)) + 120,
                        label: this.state.totalStreams - streamCount +''
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
            this.websocket.send(JSON.stringify(msg));

        }, 30000)
    }

    render() {

        // var graph = {
        //     nodes: [
        //         {id: 1, label: 'Node 1'},
        //         {id: 2, label: 'Node 2'},
        //         {id: 3, label: 'Node 3'},
        //         {id: 4, label: 'Node 4'},
        //         {id: 5, label: 'Node 5'}
        //     ],
        //     edges: [
        //         {from: 1, to: 2},
        //         {from: 1, to: 3},
        //         {from: 2, to: 4},
        //         {from: 2, to: 5}
        //     ]
        // };
        //
        // var options = {
        //     layout: {
        //         hierarchical: true
        //     },
        //     edges: {
        //         color: "#000000"
        //     }
        // };
        //
        // var events = {
        //     select: function(event) {
        //         var { nodes, edges } = event;
        //     }
        // }

        let stats = this.state.stats;
        let p2p = stats.p2p-stats.p2pBase;
        let source = stats.source-stats.sourceBase;
        return (
            <div>
                <Graph style={{ height: "640px" }} graph={this.state.graph} options={this.state.options} events={this.state.events} />
                <p>p2p: {p2p}KB  source: {source}KB </p>
            </div>
        );
    }
}

export default Topology;
