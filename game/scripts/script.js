Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};

class ItemGrid {
    constructor(item, color, column, row) {
      this.item = item;
      this.color = color;
      this.column = column;
      this.row = row;
      this.InitializeClick();
    }

    InitializeClick() {
        this.item.onclick = () => {
            if(!gridControl.isMouseAllowed) return; 
            gridControl.FindItemColor(this);
        }
    }

    InitializeStyle() {
        this.item.style.bottom = this.row * gridControl.SizeItem + "px";
        this.item.style.opacity = "1";
    }

    FindMoreMatches(listItemSelect, color) {
        let checkIncludesItem = () =>  listItemSelect.includes(this);

        if(this.color == color && !checkIncludesItem()) {
            const top = gridControl.GetTop(this);
            const right = gridControl.GetRight(this);
            const bottom = gridControl.GetBottom(this);
            const left = gridControl.GetLeft(this);

            listItemSelect.push(this);
            if(top !== undefined) top.FindMoreMatches(listItemSelect, color);
            if(right !== undefined) right.FindMoreMatches(listItemSelect, color);
            if(bottom !== undefined) bottom.FindMoreMatches(listItemSelect, color);
            if(left !== undefined) left.FindMoreMatches(listItemSelect, color);
        }
    }

    CheckItemNotDefined() {
        return this.item === undefined;
    }

    DeleteItem(){
        this.item.remove();
        this.item = undefined;
    }

    AnimationHide() {
        this.item.style.transform = "scale(0.6)";
        this.item.style.opacity = "0";
    }
}

class GridControl {
    constructor() {
        this.colors = ['blue','green','purple','red','yellow'];
        this.CountColumns = 9;
        this.CountRow = 9;
        this.SizeItem = 60;
        this.CountMinItem = 2;
        this.frameMilliSecond = 300;
        this.itemsGrid = [];
        this.columsBlock = [];
        this.isMouseAllowed = true;
        this.InitItems();
    }

    InitItems() {
        let CreateColumn = ()=> {
            const colBlock = document.createElement("div");
            colBlock.className = "game__list";
            colBlock.style.width = this.SizeItem + "px";
            colBlock.style.height = this.SizeItem * this.CountRow + 7 + "px";
            return colBlock;
        } 

        let containerColumns = document.querySelector(".game__columns");
        
        for (let col = 0; col < this.CountColumns; col++) {
            this.itemsGrid[col] = [];

            let colBlock = CreateColumn();

            containerColumns.appendChild(colBlock);
            this.columsBlock.push(colBlock);

            this.CreateItems(col, this.CountRow);
        }
        this.StartAnimationItems();
    }

    CreateItems(column, countEmpty) {
        let getRandomColor = () => this.colors[ GetRandomInt(0, this.colors.length) ];

        const indexStart = this.CountRow - countEmpty;
        for (let i = indexStart; i < this.CountRow; i++) {
            const color = getRandomColor();
            const itemBlock = this.CreateItemBlock( this.CountRow + (i - indexStart) , color);
            this.columsBlock[column].appendChild(itemBlock);

            this.itemsGrid[column][i] = new ItemGrid(itemBlock, color, column, i);
        }
    }
    
    CreateItemBlock(row, color) {
        const itemBlock = document.createElement("div");
        itemBlock.className = "game__list-items";
        itemBlock.style.bottom = row * this.SizeItem + "px";
        itemBlock.style.height =  this.SizeItem * 1.12 + "px";
        itemBlock.style.width =  this.SizeItem + "px";
        itemBlock.style.background = "url(./img/items/" + color + ".webp) center/cover no-repeat";
        itemBlock.style.transition = "all " + this.frameMilliSecond + "ms ease-out";
        itemBlock.style.opacity = 0;
        return itemBlock;
    }

    StartAnimationItems() {
        setTimeout(() =>
            this.itemsGrid.forEach(col =>
                    col.forEach(item =>
                            item.InitializeStyle()
                    )
            ), this.frameMilliSecond * 0.5
        );
    }

    FindItemColor(item) {
        let listItemSelect = [];
        item.FindMoreMatches(listItemSelect, item.color);
        this.ItemSelectAction(listItemSelect);
    }

    ItemSelectAction(listItemSelect){
        if(listItemSelect.length >= this.CountMinItem) {
            gameManager.AddStatistic(listItemSelect.length);

            this.isMouseAllowed = false;

            listItemSelect.forEach(item => item.AnimationHide());

            setTimeout(() => { gameManager.CheckGameAct();  this.isMouseAllowed = true;}, this.frameMilliSecond * 2 + this.frameMilliSecond * 0.5);
            setTimeout(() => {
                listItemSelect.forEach(item => item.DeleteItem());
                this.Filling();
            }, this.frameMilliSecond);
        } else gameManager.AddStatistic(-1);
    }

    Filling() {
        for (let col = 0; col < this.CountColumns; col++) {
            let countEmpty = 0;
            for (let row = 0; row < this.CountRow; row++) {
                let item = this.itemsGrid[col][row];

                if(item.CheckItemNotDefined()) {
                    countEmpty++;
                }
                else if(countEmpty > 0) {
                    this.itemsGrid[col][row - countEmpty] = new ItemGrid(item.item, item.color, col, row - countEmpty);
                }
            }
            this.CreateItems(col, countEmpty);
        }
        this.StartAnimationItems();
    }

    Replay() {
        for (let col = 0; col < this.CountColumns; col++) {
            this.itemsGrid[col].forEach(item => item.DeleteItem());
            this.CreateItems(col, this.CountRow);
        }
        this.StartAnimationItems();
    }

    GetTop(item) {
        return this.itemsGrid[item.column][item.row + 1];
    }

    GetRight(item) {
        if(this.itemsGrid[item.column + 1] !== undefined)
            return this.itemsGrid[item.column + 1][item.row];
        return undefined;
    }

    GetBottom(item) {
        return this.itemsGrid[item.column][item.row - 1];
    }

    GetLeft(item) {
        if(this.itemsGrid[item.column - 1] !== undefined)
            return this.itemsGrid[item.column - 1][item.row];
        return undefined;
    }

}

class GameManager {
    constructor () {
        this.textScore = document.querySelector(".header__score-text");
        this.textStep = document.querySelector(".header__step-text");
        this.progress = document.querySelector(".header__progress-value");
        this.textScoreEnd = document.querySelector(".popup__inbetweener-item");
        this.headerTextPopup = document.querySelector(".popup__header-text");
        this.popup = document.querySelector(".popup");

        this.Score = 0;
        this.Step = 0;
        this.WinScore = 1000;
        this.MaxStep = 20;

        this.InitClick();
        this.UpdateInfo();
    }

    InitClick() {
        this.popup.onclick = () => {
            this.Replay();
        }
    }

    Replay() {
        this.popup.style.display = "none";
        this.Score = 0;
        this.Step = 0;
        this.UpdateInfo();
        gridControl.Replay();
    }

    UpdateInfo(){
        let updateStep = () => this.textStep.innerText = this.MaxStep - this.Step;
        let updateScore = () => this.textScore.innerText = this.Score;
        let updateProgress = () => this.progress.style.width = (this.Score / this.WinScore * 100).clamp(0, 100) + "%";

        updateStep();
        updateScore();
        updateProgress();
    }

    AddStatistic(ItemSelectCount) {
        let addScore = () => this.Score += ItemSelectCount * 10;
        let addStep = () => this.Step++;

        addStep();

        if(ItemSelectCount != -1)
            addScore();
        else this.CheckGameAct();

        this.UpdateInfo();
    }

    CheckGameAct(){
        if(this.Score >= this.WinScore)
            this.GameWin();
        else if(this.Step >= this.MaxStep)
            this.GameOver();
    }

    GameWin() {
        this.headerTextPopup.innerText = "Win :)";
        this.ShowPopup();
    }

    GameOver() {
        this.headerTextPopup.innerText = "Потрачено :(";
        this.ShowPopup();
    }

    ShowPopup() {
        this.popup.style.display = "flex";
        this.textScoreEnd.innerText = this.Score;
    }
}

let gridControl = new GridControl();
let gameManager = new GameManager();

function GetRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}