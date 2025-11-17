# vue-admin-login

这是一个基于 Vue 和 Element UI 的极简后台管理系统，支持 OTA 固件管理，包括固件上传、获取最新固件、固件列表、固件删除等功能。


自带测试账户admin1密码123456 
admin2密码123456
admin3密码123456
admin4密码123456

## 功能特性

- 用户登录、权限控制
- OTA 固件上传（支持版本、硬件版本、状态等参数）
- 获取最新固件信息（支持 released、draft、testing 等状态）
- 固件列表查询与筛选
- 固件删除
- 基于 Element UI 的简洁界面

## 目录结构

```
├── src
│   ├── api           # 所有 API 请求方法
│   ├── views
│   │   └── admin
│   │       ├── index.vue   # 管理员首页（固件上传、最新固件、固件列表等）
│   │       └── ota.vue     # OTA 管理页面
│   ├── router        # 路由配置
│   ├── utils         # 工具函数
│   └── ...
├── public
├── package.json
└── ...
```

## 快速开始

```bash
# 克隆项目
git clone https://github.com/Jan13242342/frontend.git

# 进入项目目录
cd vue-admin-login

# 安装依赖
npm install

# 启动开发环境
npm run dev
```

浏览器访问 [http://localhost:9528](http://localhost:9528)

## 主要页面说明

- **管理员首页**：支持固件上传、获取最新固件、固件列表展示与删除等操作。
- **OTA 管理**：专门的 OTA 固件管理页面，支持固件的多种操作。

## 主要依赖

- [Vue](https://cn.vuejs.org/)
- [Element UI](https://element.eleme.cn/)
- [axios](https://github.com/axios/axios)

## 常用命令

```bash
# 代码格式检查
npm run lint

# 生产环境打包
npm run build:prod

# 预览生产环境
npm run preview
```

## 其它说明

- 后端接口需支持 token 鉴权，部分接口需管理员权限。
- 固件上传、删除等操作请确保有相应权限。

## License

MIT
