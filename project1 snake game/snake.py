from turtle import *  # 導入turtle模組
from random import randrange  # 導入randrange函數
from time import sleep  # 導入sleep函數

# 初始化蛇的位置
snake = [[i * 10, 0] for i in range(6)]
# 隨機生成蘋果的位置
apple_x, apple_y = randrange(-20, 18) * 10, randrange(-19, 19) * 10
# 初始化蛇的移動方向
aim_x, aim_y = 10, 0
# 定義蘋果生成的所有可能位置
apple_positions = {(x * 10, y * 10) for x in range(-20, 19) for y in range(-19, 20)}

# 檢查蛇是否在邊界內
def inside():
    return -210 < snake[-1][0] < 190 and -190 < snake[-1][1] < 210

# 畫方塊
def square(x, y, size, color_name):
    up()
    goto(x, y)
    down()
    color(color_name)
    begin_fill()
    for _ in range(4):
        forward(size)
        right(90)
    end_fill()

# 改變蛇的移動方向
def change(x, y):
    global aim_x, aim_y
    aim_x, aim_y = x, y

# 遊戲結束
def game_over(message):
    clear()
    square(-210, 210, 420, "black")
    square(-200, 200, 390, "green")
    for seg in snake[:-1]:
        square(seg[0], seg[1], 10, "black")
    square(snake[-1][0], snake[-1][1], 10, "red")
    up()
    goto(0, 0)
    write(message, align="center", font=("Arial", 24, "normal"))
    update()
    sleep(2)
    up()
    goto(0, -30)
    write("Press 'r' to Restart or 'q' to Quit", align="center", font=("Arial", 16, "normal"))
    update()

# 重新開始遊戲
def restart():
    global snake, apple_x, apple_y, aim_x, aim_y
    snake = [[i * 10, 0] for i in range(6)]
    apple_x, apple_y = randrange(-20, 18) * 10, randrange(-19, 19) * 10
    aim_x, aim_y = 10, 0
    clear()
    gameLoop()

# 結束遊戲
def quit_game():
    bye()

# 遊戲主循環
def gameLoop():
    global apple_x, apple_y
    new_head = [snake[-1][0] + aim_x, snake[-1][1] + aim_y]
    snake.append(new_head)
    
    print(f"New head position: {new_head}")  # 調試輸出

    if not inside() or new_head in snake[:-1]:
        print("Game over condition met")  # 調試輸出
        game_over("GAME OVER")
        return

    if new_head == [apple_x, apple_y]:
        apple_x, apple_y = randrange(-20, 18) * 10, randrange(-19, 19) * 10
        while [apple_x, apple_y] in snake:
            apple_x, apple_y = randrange(-20, 18) * 10, randrange(-19, 19) * 10
        print(f"Ate apple, new apple position: {apple_x, apple_y}")  # 調試輸出
    else:
        snake.pop(0)
    
    if all(pos in snake for pos in apple_positions):
        print("Win condition met")  # 調試輸出
        game_over("YOU WON!")
        return
    
    clear()
    square(-210, 210, 420, "black")
    square(-200, 200, 390, "green")
    square(apple_x, apple_y, 10, "red")
    for seg in snake:
        square(seg[0], seg[1], 10, "black")
    update()
    ontimer(gameLoop, 200)

setup(420, 420, 0, 0)  # 設置遊戲窗口
hideturtle()  # 隱藏烏龜
tracer(False)  # 關閉動畫
listen()  # 監聽鍵盤事件
onkey(lambda: change(0, 10), "w")  # 向上移動
onkey(lambda: change(0, -10), "s")  # 向下移動
onkey(lambda: change(-10, 0), "a")  # 向左移動
onkey(lambda: change(10, 0), "d")  # 向右移動
onkey(restart, "r")  # 重新開始
onkey(quit_game, "q")  # 結束遊戲
gameLoop()  # 開始遊戲循環
done()  # 結束turtle模組
