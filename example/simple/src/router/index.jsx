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
    const pathname = this.get("pathname");

    if (!Array.isArray(children)) {
      children = [children];
    }

    const child = children.find(child => {
      if (child.tag.symbol === routeSymbol) {
        const pathReg = pathToRegexp(clean(normalize(child.props.path)));
        const exp = pathReg.exec(pathname);
        // Should allow for things such as 
        // `/user/:userId/dashboard/:dashboardName`
        // where the generated params are userId and dashboardName respectively.
        if (exp) {
          return true;
        }
      }
      return false;
    });

    if (child) {
      const m = match(child.props.path);
      const params = m(pathname);
      yield createElement(child.tag, params);
    } else {
      yield null;
    }
  }
}

export function* Route({ children, userId }) {
  console.log(userId);
  return children;
}

Route.symbol = routeSymbol;
