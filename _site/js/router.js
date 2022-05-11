import zip from "./zip.js";

/*
  TODO abstract this, use [router:] attributes, example -> router:route="base/section" ( this is the layout ), 
  router:part="work" ( this could be part of a page that uses the same layout as another )
 */

// Fetch html string and return a new html document
/**
 * @param {string} href
 * @returns {Promise<{page: Document,title: string}>}
 */
const getHTML = async href => {
  const res = await fetch(href);
  const page = new DOMParser().parseFromString(await res.text(), "text/html");
  return { page, title: page.querySelector("title").innerHTML };
};

// Query [router:page] elements
/**
 * @param {Document} doc
 * @returns {{elm:HTMLElement,val:String}[]}
 */
const routerAttr = doc => {
  return Array.from(doc.querySelectorAll("[router\\:page]")).map(elm => ({
    elm,
    val: elm.getAttribute("router:page"),
  }));
};

// Get the diff between destination/source page
/**
 *  @param {Document} destination
 * @returns {Promise<[{elm:HTMLElement,val:String},{elm:HTMLElement,val:String}]>}
 */
const diffPage = async destination => {
  const [destrouters, srcrouters] = [destination, document].map(routerAttr);
  const zipedrouters = zip(destrouters, srcrouters);
  for (const [dest, src] of zipedrouters) {
    if (dest.val !== src.val) {
      return [dest, src];
    }
  }
  return [null, null];
};

// sets the page
/**
 * @param {object} o
 * @param {string} o.pathname
 * @param {string} o.href
 */
const setPage = async (target, outside = false, scrollTop = 0, push = true) => {
  const { pathname, href } = target;

  document.querySelector('main').classList.add('fetching')

  const destinationDocument = await getHTML(href);
  const [dest, src] = await diffPage(destinationDocument.page);

  if (push) {
    // set scrollTop position on current position at history stack
    history.replaceState(
      { scrollTop: src.elm.scrollTop },
      null,
      location.pathname
    );
    // push destination path to history stack
    history.pushState(null, null, pathname);
  } else {
    // TODO, Keep track of scrollTop onpostate
  }

  // prepend destination document to source parent
  src.elm.parentElement.append(dest.elm);
  // TODO, make this unhacky.
  // Wait one cycle to let the dom re-render before scrolling
  setTimeout(() => {
    dest.elm.scroll({
      top: scrollTop,
    });
  }, 1);

  // Transition - -
  src.elm.classList.add("slideOut");
  dest.elm.classList.add("slideIn");

  const pageTransitionDuration = parseFloat(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--page-transition-duration")
      .replace("ms", "")
  );

  setTimeout(() => {
    src.elm.remove();
    dest.elm.classList.remove("slideIn");
    document.documentElement.classList.remove("time-out");
  }, pageTransitionDuration);

  document.documentElement.setAttribute("router:current-page", pathname);
  document.querySelector("title").innerHTML = destinationDocument.title;
  document.querySelector("f-nav").setAttribute("state", "close");
  document.dispatchEvent(
    new CustomEvent("f-nav:done", { detail: { outside }, bubbles: true })
  );
};

// handle click and f-nav events
const handle = async e => {
  let { target, detail } = e;

  // f-nav
  if (detail.pathname) {
    console.log(detail);
    setPage(e.detail);
  }
  // "regular" anchor clicks
  else {
    //if target is anchor and anchor origin is same as current webpage
    if (
      target.tagName === "A" &&
      target.origin === location.origin &&
      target.pathname !== location.pathname
    ) {
      e.preventDefault();
      setPage(target, true);
    }
  }
};
// listen for f-nav events
document.addEventListener("f-nav:routing", handle);

// listen for anchor clicks
document.addEventListener("click", handle);

// handle history change
onpopstate = e => {
  setPage(location, true, e.state?.scrollTop || 0, false);
};

//

//

//

// misc - - - -
// TODO abstract this
// Idea is to fetch destination dependent resources before appending the destination document to the dom
/**
 * @param {Document} dom
 * @param {keyof HTMLElementTagNameMap} selectorString
 */
const preFetchDOMResources = async (dom, selectorString) => {
  const resources = dom.querySelectorAll(`${selectorString}[src]`);
  console.log("prefetch resources");
  console.log(resources);
  return Promise.all([...resources].map(async src => fetch(src.src)));
};

// Query [router:resource] elements
// Idea is to query script tags in destination document to later append them dom head
/**
 * @param {Document} doc
 * @returns {{elm:HTMLElement,val:String}[]}
 */
const routerResource = doc => {
  return Array.from(doc.head.querySelectorAll("[router\\:resource]")).map(
    elm => ({
      elm,
      val: elm.getAttribute("router:resource"),
    })
  );
};
