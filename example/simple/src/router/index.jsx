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

export function* Routes() {
  for (let { children } of this) {
    const pathname = this.get("pathname");

    if (!Array.isArray(children)) {
      children = [children];
    }

    const child = children.find(child => {
      if (child.tag.symbol === routeSymbol) {
        const pathReg = pathToRegexp(child.props.path.replace(/\/\//g, "/"));
        const exp = pathReg.exec(pathname);
        if (exp) {
          return true;
        }
      }
      return false;
    });

    if (child) {
      const m = match(child.props.path);
      const params = m(pathname);
      this.set('routeParams', {...params.params, ...child.props});
      yield child;
    } else {
      yield null;
    }
  }
}

export function Route({ children }) {
  const params = this.get('routeParams');
  
  if (!Array.isArray(children)) {
    children = [children];
  }

  return children.map(child => {
    return createElement(child.tag, {...params, ...child.props});
  });
}

Route.symbol = routeSymbol;
