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
                    direction: "UD"
                }
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
                let infolist = this.props.nodeinfo[params.nodes];
                let isp = "", province = "", city = "";
                if (infolist[0] === "Server"){
                    isp = "<b>Server</b>"
                }
                else if (infolist[0] !== undefined) {
                    isp = "<p > <b>ISP:</b> " + infolist[0] + "</p>"
                }
                if (infolist[1] !== undefined) {
                    province = "<p> <b>省份:</b>  " + infolist[1] + "</p>"
                }
                if (infolist[2] !== undefined) {
                    city = "<p> <b>城市:</b> " + infolist[2] + "</p>"
                }
                this.setState({info: isp + province + city});
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
        const {identifier} = this.state;
        const {style} = this.props;
        console.log("render");
        return (

            <div>
                <div style={style} id={identifier}>{identifier}
                </div>
                <div ref="para"/>
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