/** @jsx createElement */
import { createElement } from "@bikeshaving/crank";
import { createBrowserHistory } from "history";
import { pathToRegexp, match } from "path-to-regexp";

const history = createBrowserHistory();
const routeSymbol = Symbol("route");

export function Link({ to, children }) {
  const onclick = e => {
    e.preventDefault();
    history.push(to);
  };

  return (
    <a onclick={onclick} href={to}>
      {children}
    </a>
  );
}

export function* Router({ children }) {
  this.set("pathname", history.location.pathname);
  let unlisten;

  try {
    unlisten = history.listen((location, action) => {
      this.set("pathname", location.pathname);
      this.refresh();
    });

    while (true) {
      yield children;
    }
  } finally {
    unlisten();
  }
}

function normalize(path) {
  if (!path) return "/";
  if (path[0] === "/") return path;

  console.warn("Path type not handled yet");
  return "/";
}

function clean(path) {
  return path.replace(/\/\//g, "/");
}

export function* Routes() {
  for (let { children } of this) {
    let pathname = this.get("pathname");
    let child;

    if (!Array.isArray(children)) {
      children = [children];
    }

    child = children.find(child => {
      if (child.tag.symbol === routeSymbol) {
        // const pathReg = pathToRegexp(clean(normalize(child.props.path)));
        // const exp = pathReg.exec(pathname);
        const m = match(child.props.path);
        const n = m(pathname);
        
        if (n) {
          return createElement(child, n.params);
        }
      }
      return false;
    });

    if (child) {
      yield child;
    } else {
      yield null;
    }
  }
}

export function Route({ children }) {
  return children;
}

Route.symbol = routeSymbol;
