import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./reducers"
import { Mode, resize, addMacro } from "./reducers/slice";
import Sidebar from "./components/Sidebar"
import Visualiser from "./components/Visualiser"

export default function App() {

    const mode = useSelector((state: RootState) => state.currentState).mode

    const dispatch = useDispatch()

    useEffect(() => {

        const onResize = () => {

            const height = window.innerHeight
            const width = window.innerWidth

            dispatch(resize({ height: height, width: width }))

            console.log("resized to: ", width, "x", height)
        }

        window.addEventListener("resize", onResize)

        return () => {
            window.removeEventListener("resize", onResize)
        }

    })

    return (
        <div className="window">
            <div className="content">
                <Sidebar />
                {mode == Mode.VISUALISER ? <Visualiser /> : <div></div>}
            </div>
        </div>)
}