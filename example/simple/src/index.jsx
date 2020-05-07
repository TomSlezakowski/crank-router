/** @jsx createElement */
import { createElement, Fragment } from "@bikeshaving/crank";
import { renderer } from "@bikeshaving/crank/dom";
import { Router, Link, Routes, Route } from "./router";

function User({ userId, children }) {
  return <h1>USER {userId}</h1>;
}

function* App() {
  while (true) {
    yield (
      <Router>
        <Link to="/">
          <h1>Crank Router Demo</h1>
        </Link>
        <Link to="/about">About</Link>
        <Link to="/users">Users</Link>
        <Routes>
          <Route path="/">
            <h1>Root</h1>
            <p>This is the home page</p>
          </Route>
          <Route path="/about">
            <Fragment>
              <h1>about</h1>
              <Link to="/home">Home</Link>
            </Fragment>
          </Route>
          <Route path="/users">
            <Fragment>
              <h1>Users</h1>
              <Link to="/user/foo">Foo</Link>
              <Link to="/user/bar">Bar</Link>
            </Fragment>
          </Route>
          <Route path="/user/:userId">
            <User />
          </Route>
        </Routes>
      </Router>
    );
  }
}

renderer.render(<App />, document.body);