import React, {Component} from "react";
import defaultsDeep from "lodash/fp/defaultsDeep";
import isEqual from "lodash/isEqual";
import differenceWith from "lodash/differenceWith";
import vis from "vis";
import uuid from "uuid";
import PropTypes from "prop-types";


class Graph extends Component {
    constructor(props) {
        super(props);
        const {identifier} = props;
        this.updateGraph = this.updateGraph.bind(this);
        this.state = {
            identifier: identifier !== undefined ? identifier : uuid.v4(),
            info: "<tr></tr>",
        };
    }

    componentDidMount() {
        this.edges = new vis.DataSet();
        this.edges.add(this.props.graph.edges);
        this.nodes = new vis.DataSet();
        this.nodes.add(this.props.graph.nodes);
        this.updateGraph();
    }

    shouldComponentUpdate(nextProps, nextState) {
        let nodesChange = !isEqual(this.props.graph.nodes, nextProps.graph.nodes);
        // console.warn(`shouldComponentUpdate this ${JSON.stringify(this.props.graph.edges)} next ${JSON.stringify(nextProps.graph.edges)}`);
        let edgesChange = !isEqual(this.props.graph.edges, nextProps.graph.edges);
        // let edgesChange = !nodesChange;
        let optionsChange = !isEqual(this.props.options, nextProps.options);
        let eventsChange = !isEqual(this.props.events, nextProps.events);


        if (nodesChange) {
            const idIsEqual = (n1, n2) => n1.id === n2.id;
            const nodesRemoved = differenceWith(this.props.graph.nodes, nextProps.graph.nodes, idIsEqual);
            const nodesAdded = differenceWith(nextProps.graph.nodes, this.props.graph.nodes, idIsEqual);
            const nodesChanged = differenceWith(
                differenceWith(nextProps.graph.nodes, this.props.graph.nodes, isEqual),
                nodesAdded
            );
            this.patchNodes({nodesRemoved, nodesAdded, nodesChanged});
        }

        if (edgesChange) {
            // console.warn(`edgesChange`);
            // console.warn(`shouldComponentUpdate this ${JSON.stringify(this.props.graph.edges)} next ${JSON.stringify(nextProps.graph.edges)}`);
            const edgesRemoved = differenceWith(this.props.graph.edges, nextProps.graph.edges, isEqual);
            let edgesAdded = [], edgesChanged = [];
            if (nextProps.graph.edges.length > this.props.graph.edges.length) {    //Added
                edgesAdded = differenceWith(nextProps.graph.edges, this.props.graph.edges, isEqual);
            } else if (nextProps.graph.edges.length === this.props.graph.edges.length) {     //Changed
                edgesChanged = differenceWith(nextProps.graph.edges, this.props.graph.edges, isEqual);
            }
            // const edgesChangedAdded = differenceWith(nextProps.graph.edges, this.props.graph.edges, isEqual);
            // const edgesAdded = differenceWith(nextProps.graph.edges, this.props.graph.edges, isEqual);
            // const edgesChanged = differenceWith(
            //     differenceWith(nextProps.graph.edges, this.props.graph.edges, isEqual),
            //     edgesAdded
            // );
            // const edgesChanged = differenceWith(edgesChangedAdded, this.props.graph.edges, isEqual);
            this.patchEdges({edgesRemoved, edgesAdded, edgesChanged});
        }

        if (optionsChange) {
            this.Network.setOptions(nextProps.options);
        }

        if (eventsChange) {
            let events = this.props.events || {};
            for (let eventName of Object.keys(events)) this.Network.off(eventName, events[eventName]);

            events = nextProps.events || {};
            for (let eventName of Object.keys(events)) this.Network.on(eventName, events[eventName]);
        }
        if (this.state.info !== nextState.info) {
            this.refs.para.innerHTML = nextState.info;
        }
        return false;
    }

    componentDidUpdate() {
        this.updateGraph();
    }

    patchEdges({edgesRemoved, edgesAdded, edgesChanged}) {
        this.edges.remove(edgesRemoved);
        // console.warn(`add ${JSON.stringify(edgesAdded)} update ${JSON.stringify(edgesChanged)}`);
        this.edges.add(edgesAdded);
        this.edges.update(edgesChanged);
    }

    patchNodes({nodesRemoved, nodesAdded, nodesChanged}) {
        this.nodes.remove(nodesRemoved);
        this.nodes.add(nodesAdded);
        this.nodes.update(nodesChanged);
    }

    updateGraph() {
        // console.log(this.state.info);
        let container = document.getElementById(this.state.identifier);
        let defaultOptions = {
            physics: {
                stabilization: false
            },
            autoResize: false,
            edges: {
                smooth: false,
                color: "#000000",
                width: 0.5,
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 0.5
                    }
                }
            }
        };

        // merge user provied options with our default ones
        var options = {
            autoResize: true,
            interaction: {hover: true},
            layout: {
                hierarchical: {
                    sortMethod: "directed",
                    direction: "UD"
                }
            },
            edges: {
                smooth: true,
                arrows: {to: true}
            }
        };

        this.Network = new vis.Network(
            container,
            Object.assign({}, this.props.graph, {
                edges: this.edges,
                nodes: this.nodes
            }),
            options
        );

        // this.infomap = this.props.nodeinfo;

        // var tempThis = this;
        this.Network.on("click", function (params) {
            if (this.props.nodeinfo[params.nodes] !== undefined) {
                let mystyle = "padding:6px;color:#474748;border:2px;background:white;border-radius:5px;margin-left:3px;margin-right:3px";

                let infolist = this.props.nodeinfo[params.nodes];
                console.log(infolist);
                let isp = "", province = "", city = "", ipaddr = "", netspeed = "", uploadbw = "";
                if (infolist[0] === "Server") {
                    isp = "<span style=" + mystyle + "> <b>Server</b></span>"
                }
                else if (infolist[0] !== undefined) {
                    isp = "<span style=" + mystyle + "> <b>ISP:</b> " + infolist[0] + "</span>"
                }
                if (infolist[1] !== undefined) {
                    province = "<span style=" + mystyle + "> <b>省份:</b>  " + infolist[1] + "</span>"
                }
                if (infolist[2] !== undefined) {
                    city = "<span style=" + mystyle + ">  <b>城市:</b> " + infolist[2] + "</span>"
                }
                if (infolist[3] !== undefined) {
                    ipaddr = "<span style=" + mystyle + "> <b>IP:</b> " + infolist[3] + "</span>"
                }
                if (infolist[4] !== undefined) {
                    netspeed = "<span style=" + mystyle + "> <b>速度:</b> " + infolist[4] + "</span>"
                }
                if (infolist[4] !== undefined) {
                    uploadbw = "<span style=" + mystyle + "> <b>上行带宽:</b> " + infolist[5] + "</span>"
                }
                this.setState({info: isp + province + city + ipaddr + uploadbw});
            }
        }.bind(this));

        if (this.props.getNetwork) {


            this.props.getNetwork(this.Network);
        }

        if (this.props.getNodes) {
            this.props.getNodes(this.nodes);
        }

        if (this.props.getEdges) {
            this.props.getEdges(this.edges);
        }

        // Add user provied events to network
        let events = this.props.events || {};
        for (let eventName of Object.keys(events)) {
            this.Network.on(eventName, events[eventName]);
        }
    }

//     React.createElement("div", null,
//     React.createElement("div",
// {
//     id: identifier,
//     style
// }, identifier),
// React.createElement("input", {id: "infodiv", value: this.state.info}, )
    render() {
        let mystyle = {
            padding: '6px',
            color: '#474748',
            border: '1px solid #E7EAEC',
            background: 'white',
            borderRadius: '5px'
        };
        const {identifier} = this.state;
        const {style} = this.props;
        style.border = '1px solid #E7EAEC';
        style.width = '1200px';
        style.marginLeft = 'auto';
        style.marginRight = 'auto';
        style.marginTop = '50px';
        style.marginBottom = '50px';
        style.background = '#FAFAFB';
        style.borderRadius = '8px';
        let backgroundstyle = {
            paddingTop: '30px',
            paddingBottom: '30px',
            marginBottom: '30px',
            color: 'inherit',
            backgroundColor: '#eee',
        };
        return (
            <div>
                <div style={backgroundstyle}>
                    <div>
                        <div style={style} id={identifier}>{identifier}
                        </div>
                    </div>
                    <div ref="para"/>
                </div>
            </div>
        );


    }
}

Graph.defaultProps = {
    graph: {},
    style: {width: "100%", height: "100%"},
    nodeinfo: {}
};
Graph.propTypes = {
    graph: PropTypes.object,
    style: PropTypes.object,
    nodeinfo: PropTypes.object,
    getNetwork: PropTypes.func,
    getNodes: PropTypes.func,
    getEdges: PropTypes.func,
};

export default Graph;