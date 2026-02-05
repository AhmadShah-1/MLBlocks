# MLBlocks (VSCode Extension)

MLBlocks provides a visual, notebook-like block canvas for assembling Python ML workflows. Users can drag predefined blocks, edit inline or in a full editor, rewire the control-flow chain, and export to a runnable `main.py`.

## Run Program

- Navigate inside a folder
- Press f5
- Click ctrl + shift + p
- Type MLBlocks: Open Canvas
- Wait 5 seconds
- Click ctrl + shift + p
- Type MLBlocks: Open Canvas

## More Commands

- `MLBlocks: Open Canvas`
- `MLBlocks: Convert Project`
- `MLBlocks: Run Project`
- `MLBlocks: Debug Project`
- `MLBlocks: Stop Execution`

## Features

This extension provides an easy digestable way for handling large code repositories, as well as aiding in ML Development

- Right-Click selct "Custom Block" to create a fully custom block (Rename Header/Output type)
- Use the Left pane to drag and drop blocks of your choice
- Connect blocks using the wire tool (Output (Red) --> Input (Green))
- The Execution Order tab will show the flow of the program

There are two ways to run the program (similiar to a .py file and a .ipynb file)

#### To replicate a .py file execution

- Connect all blocks together (Every block must be connected) [If the execution order does not show up, you have an invalid/missing connection]
- You can click the "Open Editor" button on a block, to open a seperate file to edit your block in a larger view [ctrl+s to save, change will be applied in real-time]
- Click the "Convert" button at the top, which will translate the blocks to .py files in the "ml_blocks_output"
- Click the "Run" button to see execution

#### To replicate a .ipynb file execution

- No need to connect all blocks
- You can select the "Run Block" to just run that piece of code
- You can link several blocks together, click "Run Block" on a downstream block, and all previous blocks up to (including) the current block will run [In events a block relies on a variable or structure of a previous block]
