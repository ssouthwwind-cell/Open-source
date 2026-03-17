# LoRA Dataset Preparer

一个用于本地整理 LoRA / 文生图训练数据的小工具，支持图片导入、预览裁切、批量重命名、AI 打标与导出。

## 运行环境

- Node.js 18 及以上
- Windows / macOS / Linux

## 安装与启动

### 新电脑第一次使用

请先确认：

- 已安装 `Node.js 18` 或更高版本
- 电脑可以正常联网

### Windows 用户

直接双击项目根目录下的 `start.bat`。

它会自动：

- 检查 Node.js 是否已安装
- 安装依赖
- 启动本地服务
- 打开 `http://localhost:3000`

如果浏览器没有自动打开，也可以手动访问：

`http://localhost:3000`

### 手动启动

在项目根目录执行：

```bash
npm install
npm run dev
```

## 使用步骤

### 1. 配置 API

打开网页后，先点击右上角设置按钮，填写：

- `Base URL`
- `API Key`
- `Model`

如果你不确定怎么填，可以先选择预设接口，再补上自己的 `API Key`。

### 2. 上传图片

- 点击右上角“上传图片”
- 支持一次选择多张图片

### 3. 预览和裁切

- 在图库中双击图片进入预览页
- 右侧可选择裁切预设，或输入自定义宽高
- 白色裁切框可以拖动
- 每张图片的裁切位置会分别保存
- 点击“应用裁切”后，会按每张图自己的裁切区域处理

### 4. 批量重命名

- 在右侧输入文件名前缀
- 可应用到当前选中的图片
- 也可应用到全部图片

### 5. AI 打标

- 确认 API 已正确填写
- 切换到打标页面
- 可生成标签列表和 Caption

### 6. 导出数据

- 点击右上角“导出 ZIP”
- 导出当前处理后的数据

### 7. 语言切换

- 点击顶部语言按钮，可切换中英文界面

## API 配置说明

你需要自行填写：

- `Base URL`
- `API Key`
- `Model`

这些配置会保存在浏览器 `localStorage` 中。

## 常见问题

### 1. 双击 `start.bat` 后打不开网页

请检查：

- 是否已安装 Node.js 18+
- 首次运行时是否正在安装依赖
- `3000` 端口是否被其他程序占用

### 2. 为什么关闭网页再打开，API Key 还在

因为配置保存在浏览器本地的 `localStorage` 中。

### 3. 国内模型能不能用

可以，优先建议使用 OpenAI Chat Completions 兼容格式接口。

## English

### Requirements

- Node.js 18+
- Windows / macOS / Linux

### Install and Start

#### First-time use on a new computer

Please make sure:

- Node.js 18 or above is installed
- Your computer can access the internet

#### Windows

Double-click `start.bat` in the project root.

It will automatically:

- Check whether Node.js is installed
- Install dependencies
- Start the local service
- Open `http://localhost:3000`

If the browser does not open automatically, you can also visit:

`http://localhost:3000`

#### Manual Start

Run the following commands in the project root:

```bash
npm install
npm run dev
```

### How to Use

#### 1. Configure API

After opening the page, click the settings button in the top-right corner and fill in:

- `Base URL`
- `API Key`
- `Model`

If you are not sure what to fill in, choose a preset first and then enter your own `API Key`.

#### 2. Upload Images

- Click `Upload Images` in the top-right corner
- Multiple images can be selected at once

#### 3. Preview and Crop

- Double-click an image in the gallery to open preview
- Choose a crop preset or enter a custom width and height
- The white crop box can be dragged
- Crop position is saved separately for each image
- Click `Apply Crop` to process images with their own crop positions

#### 4. Batch Rename

- Enter a filename prefix on the right side
- Apply to selected images or all images

#### 5. AI Tagging

- Make sure your API settings are filled in correctly
- Switch to the tagging page
- Generate tags and captions

#### 6. Export Data

- Click `Export ZIP` in the top-right corner
- Export the processed dataset

#### 7. Language Switch

- Use the language button at the top to switch between Chinese and English

### API Configuration

You need to provide:

- `Base URL`
- `API Key`
- `Model`

These values are stored in browser `localStorage`.

### FAQ

#### 1. Why does the page not open after double-clicking `start.bat`?

Please check:

- Whether Node.js 18+ is installed
- Whether dependencies are still being installed on first launch
- Whether port `3000` is already in use

#### 2. Why is my API Key still there after reopening the page?

Because the configuration is stored in browser `localStorage`.

#### 3. Can I use Chinese model providers?

Yes. OpenAI Chat Completions compatible APIs are recommended.
