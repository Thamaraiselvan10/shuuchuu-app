import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="logo">Focus Bro</div>
                <nav>
                    <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>Dashboard</NavLink>
                    <NavLink to="/tasks" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>Tasks</NavLink>
                    <NavLink to="/timer" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>Timer</NavLink>
                    <NavLink to="/alarms" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>Alarms</NavLink>
                    <NavLink to="/calendar" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>Calendar</NavLink>
                    <NavLink to="/diary" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>Diary</NavLink>
                    <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>Settings</NavLink>
                </nav>
            </aside>
            <main className="content">
                <header className="header">
                    <h2>You are the best...</h2>
                </header>
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
