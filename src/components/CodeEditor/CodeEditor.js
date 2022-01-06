import React from "react";
import { useState, useRef } from "react";
import { default as MonacoEditor } from "@monaco-editor/react";
import { withRouter } from "react-router-dom";
import { Button, Grid } from "@material-ui/core";
import Blockly from "blockly/core";
import Divider from "@material-ui/core/Divider";
import { saveAs } from "file-saver";
import Drawer from "@material-ui/core/Drawer";
import Sidebar from "./Sidebar";
import Dialog from "../Dialog";
import SaveIcon from './SaveIcon'

const CodeEditor = (props) => {
  const [fileHandle, setFileHandle] = useState();
  const [fileContent, setFileContent] = useState("");
  const [progress, setProgress] = useState(false);
  const [id, setId] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const editorRef = useRef(null);
  const [autoSave, setAutoSave] = useState(false);
  const [time, setTime] = useState(null);
  const [value, setValue] = useState("");
  const [defaultValue, setDefaultValue] = useState(
    sessionStorage.getItem("ArduinoCode")
      ? sessionStorage.getItem("ArduinoCode")
      : `
#include <senseBoxIO.h> //needs to be always included

void setup () {
         
}
          
void loop() {
          
}`
  );

  const compile = () => {
    setProgress(true);
    const data = {
      board: process.env.REACT_APP_BOARD,
      sketch: editorRef.current.getValue(),
    };
    fetch(`${process.env.REACT_APP_COMPILER_URL}/compile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.code === "Internal Server Error") {
          setProgress(false);
          setOpen(true);
          setError(data.message);
        }
        setProgress(false);
        const result = data.data.id;
        setId(result);
        console.log(result);
        const filename = "sketch";
        window.open(
          `${process.env.REACT_APP_COMPILER_URL}/download?id=${result}&board=${process.env.REACT_APP_BOARD}&filename=${filename}`,
          "_self"
        );
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const saveIno = () => {
    var filename = "sketch";
    var code = editorRef.current.getValue();

    filename = `${filename}.ino`;
    var blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    saveAs(blob, filename);
  };

  const openIno = async () => {
    const [myFileHandle] = await window.showOpenFilePicker();
    setFileHandle(myFileHandle);

    const file = await myFileHandle.getFile();
    const contents = await file.text();
    setFileContent(contents);
  };

  const toggleDrawer = (anchor, open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setOpen(false);
  };

  const resetCode = () => {
    editorRef.current.setValue(defaultValue);
  };

  const resetTimeout = (id, newID) => {
    clearTimeout(id);
    return newID;
  };

  const editValue = (value) => {
    setTime(resetTimeout(time, setTimeout(saveValue, 400)));
    setValue(value);
  };

  const saveValue = () => {
    sessionStorage.setItem("ArduinoCode", value);
    setAutoSave(true);
    setTimeout(() => setAutoSave(false), 1000);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  return (
    <div>
      <Grid container spacing={2}>
        <Drawer
          anchor={"bottom"}
          open={open}
          onClose={toggleDrawer("bottom", false)}
        >
          <h2
            style={{
              color: "#4EAF47",
              paddingLeft: "1rem",
              paddingRight: "1rem",
            }}
          >
            {Blockly.Msg.drawer_ideerror_head}
          </h2>
          <p
            style={{
              color: "#4EAF47",
              paddingLeft: "1rem",
              paddingRight: "1rem",
            }}
          >
            {Blockly.Msg.drawer_ideerror_text}
          </p>
          <Divider style={{ backgroundColor: "white" }} />
          <p
            style={{
              backgroundColor: "black",
              color: "#E47128",
              padding: "1rem",
            }}
          >
            {" "}
            {`${error}`}{" "}
          </p>
        </Drawer>
        <Grid item lg={8}>
          <div style={{display: "flex", alignItems: "center"}}>
            <h1>Code Editor</h1>
            <SaveIcon loading={autoSave} />
          </div>

          <MonacoEditor
            height="80vh"
            onChange={(value) => {
              editValue(value);
            }}
            defaultLanguage="cpp"
            defaultValue={defaultValue}
            value={fileContent}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
            }}
          />
        </Grid>
        <Grid item lg={4}>
          <Button
            style={{ padding: "1rem", margin: "1rem" }}
            variant="contained"
            color="primary"
            onClick={() => compile()}
          >
            Kompilieren
          </Button>
          <Button
            style={{ padding: "1rem", margin: "1rem" }}
            variant="contained"
            color="primary"
            onClick={() => saveIno()}
          >
            Save Code
          </Button>
          <Button
            style={{ padding: "1rem", margin: "1rem" }}
            variant="contained"
            color="primary"
            onClick={() => openIno()}
          >
            Open Code
          </Button>
          <Button
            style={{ padding: "1rem", margin: "1rem" }}
            variant="contained"
            color="primary"
            onClick={() => resetCode()}
          >
            Reset Editor
          </Button>
          <Sidebar />

          <Dialog
            style={{ zIndex: 9999999 }}
            fullWidth
            maxWidth={"sm"}
            open={progress}
            title={"Code wird kompiliert"}
            content={""}
          >
            <div>
              Dein Code wird nun kompiliert und anschließend auf deinen Computer
              heruntergeladen
            </div>
          </Dialog>
        </Grid>
      </Grid>
    </div>
  );
};

export default withRouter(CodeEditor);
