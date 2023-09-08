/**
 * Sternhalma
 * @author Stepan Fyodorovic
 * @description Sternhalma aka Chinese Checkers (1 human vs 5 AI)
 * @version v1.0.0
 */

let game; // state of game

$(function() {
  initializeGameStructure();
  displayBoards();
});

function initializeGameStructure() {

  let board = [], cell = {}, piece = {}, endZoneNum;

  // Track locations of pieces by player for fast lookup
  let pieces = { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };

  // Track progress of each player
  let progress = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };

  game =  {
    human: null,
    whoseTurn: null,
    winner: null,
    selectedPiece: null,
    possibleJumps: null,
    numTurns: 0,
    pieces: pieces,
    progress: progress
  };

  for(let row = 0; row <= 16; row++) {

    board[row] = [];

    for(let col = 0; col <= 16; col++) {

      cell = {
        row: row,
        col: col,
        playerNum: null,
        endZoneNum: null
      };

      cell.inBounds = inBounds(row, col);

      if(cell.inBounds) {

        endZoneNum = endZone(row, col);

        if(endZoneNum != null) {

          cell.endZoneNum = endZoneNum;

          // Player num is across from end zone num
          cell.playerNum = (endZoneNum + 2) % 6 + 1;

          piece = { row: row, col: col };
          pieces[cell.playerNum][pieces[cell.playerNum].length] = piece;
        }
      }
      board[row][col] = cell;
    }
  }
  game.board = board;
  game.pieces = pieces;

  return game;
}

function displayBoards() {

  let board = game.board, cell, row, col;
  let arrayBoard = $('#array-board'), tr, td;
  let normalBoard = $('#normal-board'), divRow, divCell;
  let validCellsThisRow;
  const widthPerCell = 55; // 50px + (2 * 2.5px)

  for(row = 0; row < 17; row++) {

    validCellsThisRow = 0;

    tr = $('<tr id="array-board-row-' + row + '"></tr>');
    divRow = $('<div class="row row-' + row + '"></div>');

    for(col = 0; col < board[row].length; col++) {

      cell = board[row][col];

      td = $('<td id="array-board-' + row + 'x' + col + '">' + row + ',' + col + '</td>');
      divCell = $('<div id="normal-board-' + row + 'x' + col + '" class="normal-board-cell"></div>');

      if(cell.inBounds == false) {

        td.addClass('out-of-bounds');
        divCell.addClass('out-of-bounds');
      }
      else {

        validCellsThisRow++;

        td.css('cursor', 'pointer');
        divCell.css('cursor', 'pointer');

        td.bind('click', processAction);
        divCell.bind('click', processAction);

        if(cell.playerNum > 0) {

          td.addClass('player player-' + cell.playerNum);
          divCell.addClass('player player-' + cell.playerNum);
        }
      }
      tr.append(td);
      divRow.append(divCell);
    }
    arrayBoard.append(tr);
    divRow.css('width', (validCellsThisRow * widthPerCell) + 'px');
    normalBoard.append(divRow);
  }

  $('#boards-ctr').animate({opacity: 1}, 1000);
}

let processAction = function() {

  if(game.winner != null) return;

  // Selecting a destination for the selected piece
  if(game.selectedPiece != null && $(this).hasClass('player') == false) {

    let startRow, startCol, endRow, endCol;

    let selectedPiece = game.selectedPiece.split('x');
    startRow = parseInt(selectedPiece[0]);
    startCol = parseInt(selectedPiece[1]);

    let targetSpace = $(this).prop('id').match(/\d+x\d+$/)[0].split('x');
    endRow = parseInt(targetSpace[0]);
    endCol = parseInt(targetSpace[1]);

    if(destinationIsValid(startRow, startCol, endRow, endCol)) {

      if(game.whoseTurn == null) { // opening move
        game.whoseTurn = game.board[startRow][startCol].playerNum;
        game.human = game.board[startRow][startCol].playerNum;
      }

      executeAction(startRow, startCol, endRow, endCol);

      // Check for winner immediately (setInterval's 1st iteration is delayed)
      if(winnerIs() == null) {
        advanceTurn();
      }
      else {
        game.winner = game.whoseTurn;
        game.whoseTurn = null;
        activateBlastSeries();
        return;
      }

      let interval_ID = setInterval(function() {

        game.possibleJumps = [];

        if(game.whoseTurn != game.human && game.winner == null) {

          moveAI();

          if(winnerIs() == null) {
            advanceTurn();
          }
          else {
            clearInterval(interval_ID);
            game.winner = game.whoseTurn;
            game.whoseTurn = null;
            activateBlastSeries();
          }
        }
        else {
          clearInterval(interval_ID);
        }
      }, 1000);
    }
    return;
  }

  // Deselection
  if($(this).hasClass('selected-piece')) {

    $('#array-board-' + game.selectedPiece).removeClass('selected-piece');
    $('#normal-board-' + game.selectedPiece).removeClass('selected-piece');

    game.selectedPiece = null;

    return;
  }

  // Selection
  if($(this).hasClass('player')) {

    if((game.whoseTurn == game.human && $(this).hasClass('player-' + game.human)) ||
        game.whoseTurn == null)
    {

      if(game.selectedPiece != null) { // Reselection
        $('#array-board-' + game.selectedPiece).removeClass('selected-piece');
        $('#normal-board-' + game.selectedPiece).removeClass('selected-piece');
      }

      game.selectedPiece = $(this).prop('id').match(/\d+x\d+$/)[0];
      $('#array-board-' + game.selectedPiece).addClass('selected-piece');
      $('#normal-board-' + game.selectedPiece).addClass('selected-piece');
    }

    return;
  }
};

function executeAction(startRow, startCol, endRow, endCol) {

  let startCell = game.board[startRow][startCol];
  let endCell = game.board[endRow][endCol];
  let playerNum = startCell.playerNum;
  let pieces = game.pieces[playerNum];

  endCell.playerNum = playerNum;
  startCell.playerNum = null;
  game.selectedPiece = null;

  // Move pieces
  $('#array-board-' + startRow + 'x' + startCol).removeClass('selected-piece player player-' + playerNum);
  $('#normal-board-' + startRow + 'x' + startCol).removeClass('selected-piece player player-' + playerNum);

  $('#array-board-' + endRow + 'x' + endCol).addClass('player player-' + playerNum);
  $('#normal-board-' + endRow + 'x' + endCol).addClass('player player-' + playerNum);

  // Update player's progress
  game.progress[playerNum] += calculateProgress(startRow, startCol, endRow, endCol);
  $('#progress-player-' + playerNum).html(game.progress[playerNum]);

  // Update pieces structure.
  for(let ctr = 0; ctr < pieces.length; ctr++) {

    if(pieces[ctr].row == startRow && pieces[ctr].col == startCol) {

      pieces[ctr].row = endRow;
      pieces[ctr].col = endCol;
      return;
    }
  }
}

function moveAI() {

  let pieces = game.pieces[game.whoseTurn];
  let possibleMovesOnePiece = [], possibleJumpsOnePiece = [];
  let possibleActions = [], actionIndex, action;
  let candidatesOfMaxProgress = [], maxProgress, foundTheActions;

  // Get possible actions for all 10 pieces into an array
  for(let ctr = 0; ctr < pieces.length; ctr++) {

    possibleMovesOnePiece = getPossibleMoves(pieces[ctr].row, pieces[ctr].col);
    possibleJumpsOnePiece = getPossibleJumps([{row: pieces[ctr].row, col: pieces[ctr].col}], pieces[ctr].row, pieces[ctr].col);
    possibleActions.push(...possibleMovesOnePiece, ...possibleJumpsOnePiece);
  }

  // Reorder actions based on progress value
  sortByProgressQuicksort(possibleActions, 0, possibleActions.length - 1);

  // Moves with highest progress will be at the highest indices
  actionIndex = possibleActions.length - 1;
  maxProgress = possibleActions[actionIndex].progress;

  // Iterate backwards until eligible move(s) of max progress have been found
  foundTheActions = false;

  while(foundTheActions == false) {

    if(possibleActions[actionIndex].progress == maxProgress) {

      if(possibleActions[actionIndex].landsInEnemyZone == false) {

        candidatesOfMaxProgress[candidatesOfMaxProgress.length] = possibleActions[actionIndex];
      }
    }
    else {

      // Termination condition
      if(candidatesOfMaxProgress.length > 0) {
        foundTheActions = true;
      }
      else {

        // No valid candidates at this progress level (all landed in enemy zones)
        // Continue with new (lower) progress level
        maxProgress = possibleActions[actionIndex].progress;

        if(possibleActions[actionIndex].landsInEnemyZone == false) {

          candidatesOfMaxProgress[candidatesOfMaxProgress.length] = possibleActions[actionIndex];
        }
      }
    }
    actionIndex--;
  }

  // Choose randomly from moves of equal progress
  action = candidatesOfMaxProgress[Math.floor(Math.random() * candidatesOfMaxProgress.length)];

  executeAction(action.startRow, action.startCol, action.endRow, action.endCol);

  return;
}

/**
 * @description
 * - Implementation of quicksort
 * - Hoare partition scheme chosen because it performs well with repeated values
 * - Actions are sorted according to progress
 * - Moves have progress values of -1, 0 and 1
 * - Jumps have even-numbered progress values from -16 to 16
*/
function sortByProgressQuicksort(actionsArray, startIndex, endIndex) {

  let pivotIndex;

  if(startIndex >= 0 && endIndex >= 0 && startIndex < endIndex) {

    pivotIndex = partition(actionsArray, startIndex, endIndex);
    sortByProgressQuicksort(actionsArray, startIndex, pivotIndex);
    sortByProgressQuicksort(actionsArray, pivotIndex + 1, endIndex);
  }
}

function partition(actionsArray, startIndex, endIndex) {

  let pivotValue = actionsArray[Math.floor((endIndex - startIndex) / 2) + startIndex].progress;
  let leftIndex = startIndex - 1;
  let rightIndex = endIndex + 1;
  let actionHolder;

  while(true) {

    do { leftIndex++; } while(actionsArray[leftIndex].progress < pivotValue);
    do { rightIndex--; } while(actionsArray[rightIndex].progress > pivotValue);

    if(leftIndex >= rightIndex) return rightIndex;

    // Swap actionsArray[leftIndex] with actionsArray[rightIndex]
    actionHolder = actionsArray[leftIndex];
    actionsArray[leftIndex] = actionsArray[rightIndex];
    actionsArray[rightIndex] = actionHolder;
  }
}

function calculateProgress(startRow, startCol, endRow, endCol) {

  switch(game.whoseTurn) {

    case 1: return (endRow - startRow);
    case 2: return (endRow - startRow) - (endCol - startCol);
    case 3: return -(endCol - startCol);
    case 4: return -(endRow - startRow);
    case 5: return (endCol - startCol) - (endRow - startRow);
    case 6: return (endCol - startCol);
  }
}

function advanceTurn() {

  game.numTurns++;

  if(winnerIs() == null) {
    return game.whoseTurn = game.whoseTurn % 6 + 1; // clockwise
  }
  game.winner = game.whoseTurn;
  return game.whoseTurn = null;
}

function winnerIs() {

  if(game.progress[game.whoseTurn] != 120) {
    return null;
  }

  $('td#progress-player-' + game.whoseTurn).css('background', '#39ff14');

  return game.whoseTurn;
}

function getPossibleMoves(startRow, startCol) {

  let cells = [], cell;
  let possibleMoves = [];
  let endZoneNum, playerNum, landsInEnemyZone;

  // 1. Check above cell
  if(startRow > 0) {

    cell = game.board[startRow - 1][startCol];

    if(cell.playerNum == null && cell.inBounds == true) {
      cells[cells.length] = cell;
    }
  }

  // 2. Check right cell
  if(startCol < 16) {

    cell = game.board[startRow][startCol + 1];

    if(cell.playerNum == null && cell.inBounds == true) {
      cells[cells.length] = cell;
    }
  }

  // 3. Check lower-right cell
  if(startRow < 16 && startCol < 16) {

    cell = game.board[startRow + 1][startCol + 1];

    if(cell.playerNum == null && cell.inBounds == true) {
      cells[cells.length] = cell;
    }
  }

  // 4. Check below cell
  if(startRow < 16) {

    cell = game.board[startRow + 1][startCol];

    if(cell.playerNum == null && cell.inBounds == true) {
      cells[cells.length] = cell;
    }
  }

  // 5. Check left cell
  if(startCol > 0) {

    cell = game.board[startRow][startCol - 1];

    if(cell.playerNum == null && cell.inBounds == true) {
      cells[cells.length] = cell;
    }
  }

  // 6. Check upper-left cell
  if(startCol > 0 && startRow > 0) {

    cell = game.board[startRow - 1][startCol - 1];

    if(cell.playerNum == null && cell.inBounds == true) {
      cells[cells.length] = cell;
    }
  }

  for(let ctr = 0; ctr < cells.length; ctr++) {

    endZoneNum = endZone(cells[ctr].row, cells[ctr].col);
    playerNum = game.whoseTurn;
    landsInEnemyZone = false;

    if(endZoneNum != null && playerNum != endZoneNum && playerNum != (endZoneNum + 2) % 6 + 1) {
      landsInEnemyZone = true;
    }

    possibleMoves[possibleMoves.length] = {
      startRow: startRow,
      startCol: startCol,
      endRow: cells[ctr].row,
      endCol: cells[ctr].col,
      progress: calculateProgress(startRow, startCol, cells[ctr].row, cells[ctr].col),
      landsInEnemyZone: landsInEnemyZone
    };
  }

  return possibleMoves;
}

function getPossibleJumps(startingPoints, originalStartRow, originalStartCol) {

  // Reset master list for ignoring duplicate jumps
  if(startingPoints[0].row == originalStartRow &&
     startingPoints[0].col == originalStartCol) {

    game.possibleJumps = [];
  }

  let startRow, startCol;
  let outerCtr, innerCtr, jumpCtr;
  let landingCells = [], newStartingPoints = [], landingCell, adjacentCell;
  let possibleJumps = [], jump, existingJump, jumpAlreadyThere, landsInEnemyZone;
  let endZoneNum, playerNum;

  for(outerCtr = 0; outerCtr < startingPoints.length; outerCtr++) {

    startRow = startingPoints[outerCtr].row;
    startCol = startingPoints[outerCtr].col;

    // 1. Check 2 cells above
    if(startRow > 1) {

      adjacentCell = game.board[startRow - 1][startCol];

      if(adjacentCell.inBounds && adjacentCell.playerNum != null) {

        landingCell = game.board[startRow - 2][startCol];

        if(landingCell.inBounds && landingCell.playerNum == null) {

          landingCells[landingCells.length] = landingCell;
        }
      }
    }

    // 2. Check 2 cells to the right
    if(startCol < 15) {

      adjacentCell = game.board[startRow][startCol + 1];

      if(adjacentCell.inBounds && adjacentCell.playerNum != null) {

        landingCell = game.board[startRow][startCol + 2];

        if(landingCell.inBounds && landingCell.playerNum == null) {

          landingCells[landingCells.length] = landingCell;
        }
      }
    }

    // 3. Check 2 cells to the lower-right
    if(startRow < 15 && startCol < 15) {

      adjacentCell = game.board[startRow + 1][startCol + 1];

      if(adjacentCell.inBounds && adjacentCell.playerNum != null) {

        landingCell = game.board[startRow + 2][startCol + 2];

        if(landingCell.inBounds && landingCell.playerNum == null) {

          landingCells[landingCells.length] = landingCell;
        }
      }
    }

    // 4. Check 2 cells below
    if(startRow < 15) {

      adjacentCell = game.board[startRow + 1][startCol];

      if(adjacentCell.inBounds && adjacentCell.playerNum != null) {

        landingCell = game.board[startRow + 2][startCol];

        if(landingCell.inBounds && landingCell.playerNum == null) {

          landingCells[landingCells.length] = landingCell;
        }
      }
    }

    // 5. Check 2 cells to the left
    if(startCol > 1) {

      adjacentCell = game.board[startRow][startCol - 1];

      if(adjacentCell.inBounds && adjacentCell.playerNum != null) {

        landingCell = game.board[startRow][startCol - 2];

        if(landingCell.inBounds && landingCell.playerNum == null) {

          landingCells[landingCells.length] = landingCell;
        }
      }
    }

    // 6. Check 2 cells to the upper-left
    if(startCol > 1 && startRow > 1) {

      adjacentCell = game.board[startRow - 1][startCol - 1];

      if(adjacentCell.inBounds && adjacentCell.playerNum != null) {

        landingCell = game.board[startRow - 2][startCol - 2];

        if(landingCell.inBounds && landingCell.playerNum == null) {

          landingCells[landingCells.length] = landingCell;
        }
      }
    }

    for(innerCtr = 0; innerCtr < landingCells.length; innerCtr++) {

      landingCell = landingCells[innerCtr];

      jumpAlreadyThere = false;
      landsInEnemyZone = false;

      // Ignore duplicate destinations
      for(jumpCtr = 0; jumpCtr < game.possibleJumps.length; jumpCtr++) {

        existingJump = game.possibleJumps[jumpCtr];

        if(existingJump.startRow == originalStartRow && existingJump.endRow == landingCell.row &&
           existingJump.startCol == originalStartCol && existingJump.endCol == landingCell.col) {

          jumpAlreadyThere = true;
        }
      }

      if(jumpAlreadyThere == false) {

        endZoneNum = endZone(landingCell.row, landingCell.col);
        playerNum = game.board[originalStartRow][originalStartCol].playerNum;

        if(endZoneNum != null && playerNum != endZoneNum && playerNum != (endZoneNum + 2) % 6 + 1) {
          landsInEnemyZone = true;
        }

        jump = {
          startRow: originalStartRow,
          startCol: originalStartCol,
          endRow: landingCell.row,
          endCol: landingCell.col,
          progress: calculateProgress(originalStartRow, originalStartCol, landingCell.row, landingCell.col),
          landsInEnemyZone: landsInEnemyZone
        };

        // Update master list for ignoring duplicate jumps
        game.possibleJumps[game.possibleJumps.length] = jump;

        // Add to return array
        possibleJumps[possibleJumps.length] = jump;

        newStartingPoints[newStartingPoints.length] = {
          row: landingCell.row,
          col: landingCell.col
        };
      }
    }
  }

  // Termination condition
  if(newStartingPoints.length == 0) {
    return [];
  }

  return [...possibleJumps, ...getPossibleJumps(newStartingPoints, originalStartRow, originalStartCol)];
}

// Validate human move
function destinationIsValid(startRow, startCol, endRow, endCol) {

  let possibleActions = [...getPossibleMoves(startRow, startCol),
                         ...getPossibleJumps([{row: startRow, col: startCol}], startRow, startCol)];

  for(let ctr = 0; ctr < possibleActions.length; ctr++) {

    if(possibleActions[ctr].endRow == endRow &&
       possibleActions[ctr].endCol == endCol) {

        return possibleActions[ctr].landsInEnemyZone != true;
    }
  }
  return false;
}

function inBounds(row, col) {

  if(row < 4 && col < 4) return false; // upper left corner
  if(row < 4 && col > 12) return false; // upper right corner
  if(row > 12 && col > 12) return false; // lower right corner
  if(row > 12 && col < 4) return false; // lower left corner

  for(let outerCtr = 0; outerCtr < 4; outerCtr++) {

    for(let innerCtr = 0; innerCtr <= 8 - outerCtr; innerCtr++) {

      if(row <= outerCtr && col > 4 + outerCtr && col <= 12) return false; // upper middle
      if(row < 12 - outerCtr && col >= 16 - outerCtr) return false; // right middle
      if(row >= 16 - outerCtr && col >= 4 && col < 12 - outerCtr) return false; // lower middle
      if(row > 4 + outerCtr && col <= outerCtr) return false; // left middle
    }
  }
  return true;
}

function endZone(row, col) {

  for(let outerCtr = 0; outerCtr < 4; outerCtr++) {

    for(let innerCtr = 0; innerCtr <= outerCtr; innerCtr++) {

      // End zones numbered by the player across the board
      // e.g. player 1 starts in end zone 4 and vice versa

      if(row == 16 - outerCtr && col == 12 - innerCtr) return 1;
      if(row == 12 - outerCtr + innerCtr && col == innerCtr + 4) return 2;
      if(row == innerCtr + 4 && col == outerCtr) return 3;
      if(row == outerCtr && col == innerCtr + 4) return 4;
      if(row == innerCtr + 4 && col == 12 - outerCtr + innerCtr) return 5;
      if(row == 12 - innerCtr && col == 16 - outerCtr) return 6;
    }
  }
  return null;
}

function blastConfetti() {

  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.7 },
    colors: $('#progress-tracker th.player-' + game.winner).css('background-color')
  });
}

function activateBlastSeries() {

  let numBlasts = 5, blastCtr = 0;

  blastConfetti(); // immediate blast (setInterval's 1st iteration is delayed)
  blastCtr++;

  let interval_ID = setInterval(function() {

    if(blastCtr++ < numBlasts) {
      blastConfetti();
    }
    else {
      clearInterval(interval_ID);
    }
  }, 1000);
}
