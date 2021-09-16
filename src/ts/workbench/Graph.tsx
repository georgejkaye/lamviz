import { useState, useEffect } from "react"

import cytoscape from "cytoscape"
import CytoscapeComponent from "react-cytoscapejs"

import { useAppSelector, useAppDispatch } from "../redux/hooks"
import { downloadedSvg, finishedDrawing } from "./workbenchSlice";

import { generateGraphElementsArray, nodeDistanceX, nodeDistanceY } from "../../bs/Graph.bs"
import { Term, Context, betaRedexes } from "../../bs/Lambda.bs"

import { generateSvg, generateAndDownloadSvg } from "./../../libs/convert-to-svg"

import { stylesheet } from "./../../data/style.js"

interface GraphProps {
    dimensions: { width: number, height: number }
    graph: { term: Term, context: Context }
    zoom: boolean
    pan: boolean
    margin: number
    nodeLabels: boolean
    edgeLabels: boolean
    redraw: boolean
    highlightedRedex: number
    interactive: boolean
}

export default function Graph(props: GraphProps) {

    let cy: cytoscape.Core

    let dispatch = useAppDispatch()

    let [currentSvg, setCurrentSvg] = useState("")

    function generateElements(term: Term, ctx: Context): [cytoscape.ElementDefinition[], [string, string, string], [string, string, string]] {
        let [nodes, edges, frees, mps] = generateGraphElementsArray(term, ctx)
        return [nodes.concat(edges), frees, mps]
    }

    const updateNodeLabels = () => {
        if (props.nodeLabels) {
            cy.nodes(".abstraction, .application").addClass("nodelabelled")
        } else {
            cy.nodes(".abstraction, .application").removeClass("nodelabelled")
        }
    }

    const updateEdgeLabels = () => {
        if (props.edgeLabels) {
            cy.elements(".arc, .abs-edge, .abs-edge-r, .app-edge-l, .app-edge-r, .var-edge-l, .var-edge-r, .term-edge").addClass("termlabelled")
        } else {
            cy.elements(".arc, .abs-edge, .abs-edge-r, .app-edge-l, .app-edge-r, .var-edge-l, .var-edge-r, .term-edge").removeClass("termlabelled")
        }
    }
    const unhighlightRedex = () => {
        cy.elements(".highlighted").removeClass("highlighted")
    }
    const highlightRedex = (i: number) => {
        cy.elements(".beta-" + i).addClass("highlighted")
    }

    //const graphDimensions = useSelector((state: RootState) => state.currentState).graphDimensions
    const svgTime = useAppSelector((state) => state.workbench).svgTime
    const [lastNodeLabels, setLastNodeLabels] = useState(props.nodeLabels)
    const [lastEdgeLabels, setLastEdgeLabels] = useState(props.edgeLabels)

    const arcRegex = /var_top_([0-9]*)_to_abs_top_([0-9]*)/

    const redrawTerm = () => {
        cy.elements().addClass("transparent")
        cy.elements().remove()

        if (props.graph.term !== undefined) {

            /* Generate elements for the current term */
            let [elements, frees, mps] = generateElements(props.graph.term, props.graph.context)

            /* Add all the elements */
            cy.add(elements)

            /* No point in faffing around with no elements */
            if (elements.length > 0) {

                let position = elements[0]["data"]["position"]
                if (position) {

                    /* Place free variables */
                    let rightest = cy.nodes().reduce((h, e) => (h > e.position("x") ? h : e.position("x")), position["x"])
                    frees.map((n, i) => {
                        let x = rightest + ((frees.length - i) * nodeDistanceX * 2) - nodeDistanceX;
                        cy.$("#" + n[0]).position({ x: x, y: 0 })
                        cy.$("#" + n[1]).position({ x: x + nodeDistanceX, y: -nodeDistanceY })
                        cy.$("#" + n[2]).position({ x: x + nodeDistanceX, y: 0 })
                    })

                    /* Make all the top nodes at the top appear at the same height */
                    let highest = cy.nodes().reduce((h, e) => (h < e.position("y") ? h : e.position("y")), position["y"])
                    cy.elements(".top").position("y", highest - (nodeDistanceY / 2))

                    /* Put the midpoints in the middle of the edges */
                    mps.map((mp) => {
                        let pos1 = cy.$("#" + mp[1]).position()
                        let pos2 = cy.$("#" + mp[2]).position()
                        cy.$("#" + mp[0]).position({ x: (pos1.x + pos2.x) / 2, y: (pos1.y + pos2.y) / 2 })
                    })

                    /* Remove dangling edges */
                    cy.nodes(".top").map((n) => {
                        if (n.degree(true) === 1) {
                            let x = n.data("id").split("_")[2]
                            cy.remove("#abs_sp_mp_" + x)
                            cy.remove("#abs_sp_" + x)
                            cy.remove("#abs_top_" + x)
                        }
                    })

                    /* Propagate beta classes */
                    for (var i = 0; i < betaRedexes(props.graph.term); i++) {
                        let arcs = cy.edges(".arc.beta-" + i).toArray()

                        for (var j = 0; j < arcs.length; j++) {
                            let absId = arcs[j].data("id").match(arcRegex)[2]
                            cy.$("#abs_" + absId).addClass("beta-" + i)
                            cy.$("#abs_sp_mp_" + absId).addClass("beta-" + i)
                            cy.$("#abs_sp_" + absId).addClass("beta-" + i)
                            cy.$("#abs_top_" + absId).addClass("beta-" + i)
                            cy.$("#abs_" + absId + "_to_abs_sp_mp_" + absId).addClass("beta-" + i)
                            cy.$("#abs_sp_mp_" + absId + "_to_abs_sp_" + absId).addClass("beta-" + i)
                            cy.$("#abs_sp_" + absId + "_to_abs_top_" + absId).addClass("beta-" + i)
                        }
                    }

                    highlightRedex(props.highlightedRedex)
                }

                updateNodeLabels()
                updateEdgeLabels()

                /* Make the map fill the screen */
                if (props.nodeLabels === lastNodeLabels && props.edgeLabels === lastEdgeLabels) {
                    cy.fit(cy.elements(), props.margin)
                }

                cy.userPanningEnabled(props.pan)
                cy.userZoomingEnabled(props.zoom)
                cy.boxSelectionEnabled(false);

                cy.elements().removeClass("transparent")
                setCurrentSvg(generateSvg(cy))
            }
        }
        dispatch(finishedDrawing())
    }

    useEffect(() => {
        redrawTerm()
    }, [props.graph.term, props.graph.context, props.dimensions])

    useEffect(() => {
        console.log("red")
        redrawTerm()
    }, [props.redraw])

    useEffect(() => {
        if (svgTime) {
            dispatch(downloadedSvg())
            generateAndDownloadSvg(cy)
        }
    }, [svgTime])

    useEffect(() => {
        updateNodeLabels()
        setLastNodeLabels(props.nodeLabels)
    }, [props.nodeLabels])

    useEffect(() => {
        updateEdgeLabels()
        setLastEdgeLabels(props.edgeLabels)
    }, [props.edgeLabels])

    useEffect(() => {
        unhighlightRedex()
        highlightRedex(props.highlightedRedex)
    }, [props.highlightedRedex])

    return (
        <div key={props.dimensions.width} className="graph">
            <CytoscapeComponent
                elements={[]}
                style={props.dimensions}
                stylesheet={stylesheet}
                cy={(cyObj) => { cy = cyObj }}
            />
        </div>
    )
}