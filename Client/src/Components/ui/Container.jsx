function Container(props) {
  return <div className={["mx-auto w-full max-w-7xl", props.className].join(" ")}>{props.children}</div>;
}

export default Container;
