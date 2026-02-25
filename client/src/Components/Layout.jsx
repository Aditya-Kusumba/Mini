import { Outlet } from "react-router-dom";
import Nav from "./Nav/Nav";

const Layout = ()=>{
    return(
        <>
            <Nav/>
            <Outlet/>
        </>
    )
}

export default Layout;