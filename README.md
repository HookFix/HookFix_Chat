# HookFix_Chat
HookFix_Chat For reference only
# HookFix Chat 

HookFixAIIII对话系统

## 部署

### 1. 创建项目目录

首先，创建一个新的目录来存放你的项目文件。你可以使用命令行来创建：

bash复制

```bash
mkdir HookFixChat
cd HookFixChat
```

### 2. 初始化npm

在项目目录中，运行以下命令来初始化一个新的npm项目。这将创建一个`package.json`文件，该文件用于存储项目的元数据和依赖项。

bash复制

```bash
npm init -y
```

这里的`-y`标志表示使用默认值来创建`package.json`文件。如果你想手动输入项目信息，可以省略这个标志。

### 3. 安装模块

```bash
npm config set registry https://registry.npmmirror.com
npm config get registry
npm install express sqlite3 body-parser cors ws
```

### 4.启动项目

```bash
node server.js
```

```bash
npm start
```

## 部署完成后

### 1.进入用户界面

```
http://127.0.0.1:3000/
```

### 2.进入后台界面

```
http://127.0.0.1:3000/admin.html
```





