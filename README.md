# messy-tally
Ever had a google forms table with variance in answered but you need to count them up? Here is a streamlined way of doing so!

Example: If you need to count how many people voted for "Daniel" but people typed "Dan/Danny/Daniel/Mr. D/Dan the man", use this tool to streamline the sorting and tallying process.

# Getting Started

Download the latest release! (Currnetly only MacOS)

then type "o" and press enter.

# Premise (Prompt to AI)

We will be making a tauri 2.0 app with react and vite. (REFER TO https://github.com/tauri-apps/tauri-docs for Tauri 2.0 documentation)

I have run the cargo tauri init command, we just have to flesh out the app on top of this skeleton structure. The relative path of the web assets is "." with respect to the root of this project.

The layout will be a simple CSV viewer on the right half. On the left half, the top half will be a prompter, and the bottom half will be the preview.

Above the prview, there will be an input to "ignore columns" where the user can put in column names to ignore and a second line for "ignore rows"

The prompter pane will run through all the field values by column. One by one, it will display the value, and the user can either type in a new "Mask value" or choose from the existing mask values.

The preview pane will show the running collections of "Mask Values" Something like:

Daniel (13) = Dan (2), Danny (4), Danny boy (4), Dan the man (2), Daniel (1)
Sam (10) = Sammy (5), maknae (4), sammy boy (1)

As the user runs through the values, if the user adds/removes the ignored rows/columns, they should be discounted or added to the queue for masking accordingly. As the user runs through the values, each cell where the value has been assigned a mask should have a unique background color automatically assigned to each mask.

After the user is done with masking all the values, the user should be able to access a second tab of the CSV viewer to see the formatted, mask-value replaced CSV. The user then can "Save as.." this CSV file onto the disk.

Additionally, we should have a third tab in the CSV viewer where we show the total numbers of values by column. Something like:

Column 1: Sam 13, Daniel 3, ...
Column 2: Daniel 3, Sam 2, ...

The formatted CSV (second tab) should have a toggle of either including the ignored row/columns or removing them from the formatted version.

The UI should be modern and simplistic, with good visual balance and clear UX flow with visually striking call to action buttons.