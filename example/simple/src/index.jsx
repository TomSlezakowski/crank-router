/** @jsx createElement */
import {createElement, Fragment, Raw} from "@bikeshaving/crank";
import {renderer} from "@bikeshaving/crank/dom";
//import { Router } from './router/index';
import "./index.css";

import { pathToRegexp } from 'path-to-regexp';
import { isParenthesizedExpression } from "typescript";

function* Comment() {
	let expanded = true;
	this.addEventListener("click", (ev) => {
		if (ev.target.className === "expand") {
			expanded = !expanded;
			this.refresh();
			ev.stopPropagation();
		}
	});

	for (const {comment} of this) {
		yield (
			<div class="comment">
				<p>
					<button class="expand">{expanded ? "[-]" : "[+]"}</button>{" "}
					<a href="">{comment.user}</a> {comment.time_ago}{" "}
				</p>
				<div style={{display: expanded ? null : "none"}}>
					<p>
						<Raw value={comment.content} />
					</p>
					<div class="replies">
						{comment.comments.map((reply) => (
							<Comment crank-key={reply.id} comment={reply} />
						))}
					</div>
				</div>
			</div>
		);
	}
}

async function Item({id}) {
	const result = await fetch(`https://api.hnpwa.com/v0/item/${id}.json`);
	const item = await result.json();
	return (
		<div class="item">
			<a href={item.url}>
				<h1>{item.title}</h1>
			</a>
			<p class="domain">{item.domain}</p>
			<p class="meta">
				submitted by <a>{item.user}</a> {item.time_ago}
			</p>
			{item.comments.map((comment) => (
				<Comment comment={comment} crank-key={comment.id} />
			))}
		</div>
	);
}

function Story({story}) {
	return (
		<li class="story">
			<a href={story.url}>{story.title}</a> <span>({story.domain})</span>
			<p class="meta">
				{story.points} points by <a href="">{story.user}</a> | {story.time_ago}{" "}
				| <a href={`#/item/${story.id}`}>{story.comments_count} comments</a>
			</p>
		</li>
	);
}

function Pager({page}) {
	return (
		<div class="pager">
			<div>
				<a>Previous </a> {page}/25 <a>Next</a>
			</div>
		</div>
	);
}

async function List({page, start = 1}) {
	const result = await fetch(`https://api.hnpwa.com/v0/news/${page}.json`);
	const stories = await result.json();
	const items = stories.map((story) => (
		<Story story={story} crank-key={story.id} />
	));
	return (
		<Fragment>
			<Pager page={page} />
			<ol start={start}>{items}</ol>
			<Pager page={page} />
		</Fragment>
	);
}

function parseHash(hash) {
	if (hash.startsWith("#/item/")) {
		const id = hash.slice(7);
		if (id) {
			return {route: "item", id};
		}
	} else if (hash.startsWith("#/top/")) {
		const page = parseInt(hash.slice(6)) || 1;
		if (!Number.isNaN(page)) {
			return {route: "top", page};
		}
	}
}

async function Loading({wait = 2000}) {
	await new Promise((resolve) => setTimeout(resolve, wait));
	return "Loading...";
}

async function* App() {
	let data;

	const route = (ev) => {
		const hash = window.location.hash;
		data = parseHash(hash);
		if (data == null) {
			data = {route: "top", page: 1};
			//window.location.hash = "#/";
		}

		if (ev) {
			this.refresh();
		}
	};

	window.addEventListener("hashchange", route);
	route();
	try {
		for await (const _ of this) {
			yield <Loading />;
			switch (data.route) {
				case "item": {
					await (yield <Item {...data} />);
					break;
				}
				case "top": {
					await (yield <List {...data} />);
					break;
				}
			}

			window.scrollTo(0, 0);
		}
	} finally {
		window.removeEventListener("hashchange", route);
	}
}

function Navbar() {
	return <div class="navbar">
		<ul>
			<li><RouteTo href="/">Home</RouteTo></li>
			<li><RouteTo href="/users">Users</RouteTo></li>
		</ul>
	</div>;
}

function Users() {
	return (
		<ul>
			<li><RouteTo href="/user/1">Brain</RouteTo></li>
			<li><RouteTo href="/user/2">BrutalDeluxe</RouteTo></li>
		</ul>
	);
}

function User({id}) {
	// const { props } = this;
	// const { id } = props;
	console.log(this);
	console.log(id);
	return ( <div>I am a user, with id</div> )
}

const routes = [{
	path: '/',
	content: <App />
}, {
	path: '/users',
	content: <Users />
}, {
	path: '/user/:id',
	content: <User />
}];

function* Root() {
	// const components = routes.map(({path, content}) => {
	// 	return (
	// 		<Route path={path}>{content}</Route>
	// 	);
	// });

	yield (
		<PageRouter routes={routes}>
			<Navbar />
			<Route path='/'>
				<App />
			</Route>
			<Route path='/users'>
				<Users />
			</Route>
			<Route path='/users/:id'>
				<User />
			</Route>
		</PageRouter>
	);
}

// Route.jsx
function Route({children, ...props}) {
	const { path } = props;
	return (
		<Fragment>{children}</Fragment>
	)
}

// RouteTo.jsx
function* RouteTo({children, ...props}) {
	this.addEventListener('click', (event) => {
		event.preventDefault();
		navigatoTo(props.href);
		this.dispatchEvent(
			new CustomEvent("location-change", {
				bubbles: true,
				detail: {
					url: props.href,
				},
			})
		);
	});
	return <a href={props.href}>{children}</a>
}

function navigatoTo(url) {
	const title = "Hmm";

	if ("undefined" !== typeof history.pushState) {
		history.pushState({page: url}, title, url);
	} else {
		window.location.assign(url);
	}
}

// PageRouter.jsx
function *PageRouter({children, routes, ...props}) {
	let url = window.location.pathname;

	this.addEventListener('location-change', (event) => {
		url = event.detail.url;
		this.refresh();
	});

	yield (<Fragment>{pathComponents(children, url)}</Fragment>);
}

function pathComponents(children, url) {
	console.log(children)
	const flatChildren = extractChildren(children);
	console.log('flat children', flatChildren)
	return flatChildren.filter((child) => {
		if (child.props.hasOwnProperty('path')) {
			console.log(typeof(child))
			const { path } = child.props;
			const regexp = pathToRegexp(clean(normalize(path)), []);
			const res = regexp.exec(url);
			if (res !== null) {
				//child.props['id'] = res[1];
				 const d = createElement(User, {id: 'somevalye'});
				 console.log(d);
				return <User id={res[1]}></User>;
			}
		} else {
			return child;//<child></child>;
		}
	});
}

const list = (
	<ul>
	  <li>Element 1</li>
	</ul>
  );
  
  console.log(list.props.children.length); // undefined

function extractChildren(root) {
	console.log('exctracing from ', root);
	let comps = [];
	for (let i = 0; i < root.length; i++) {
		const child = root[i];
		console.log(typeof(child))
		if (child.props.hasOwnProperty('children')) {
			console.log('kids', child.props)
			//console.log('FWEFWE', extractChildren(child.props.children))
			comps = comps.concat(extractChildren(child.props.children));
		} else {
			comps.push(child);
		}
		console.log(comps);
	}
	return comps;
}

function normalize(path) {
	if (!path) return '/';
	if (path[0] === '/') return path;

	console.warn('Path type not handled yet');
	return '/';
}

function clean(path) {
	return path.replace(/\/\//g, '/')
}

renderer.render(<Root />, document.body.firstElementChild);
