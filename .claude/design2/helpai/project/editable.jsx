/* EditableText — inline editable field that activates only when editing context is on. */

// Ensure EditContext exists before app.jsx loads. Namespaced to avoid clash with native browser EditContext API.
window.__HelpAi_EditContext = window.__HelpAi_EditContext || React.createContext({ editing: false });

function EditableText({ value, tag = "span", className = "", style = {}, multiline = false, onCommit, editing: forcedEditing, placeholder = "" }) {
  const ctx = React.useContext(window.__HelpAi_EditContext);
  const editing = forcedEditing !== undefined ? forcedEditing : (ctx && ctx.editing);
  const [val, setVal] = React.useState(value);
  const [active, setActive] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => { setVal(value); }, [value]);

  React.useEffect(() => {
    if (active && ref.current) {
      ref.current.focus();
      // place cursor at end
      const el = ref.current;
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [active]);

  const Tag = tag;

  if (!editing) {
    return <Tag className={className} style={style}>{val || placeholder}</Tag>;
  }

  const commit = () => {
    setActive(false);
    const next = ref.current ? ref.current.innerText.trim() : val;
    setVal(next);
    onCommit && onCommit(next);
  };

  return (
    <Tag
      ref={ref}
      className={className + " editable" + (active ? " editing" : "")}
      style={style}
      contentEditable={true}
      suppressContentEditableWarning={true}
      onFocus={() => setActive(true)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") { e.preventDefault(); ref.current.blur(); }
        if (e.key === "Escape") { ref.current.innerText = val; ref.current.blur(); }
      }}
    >
      {val}
    </Tag>
  );
}

window.EditableText = EditableText;
