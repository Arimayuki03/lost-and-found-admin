<template>
  <router-view />
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  max-width: none;
}

/* 美化表格滚动条样式 */
.el-table__body-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 3px;
  border: 1px solid #f5f7fa;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #d0d0d0;
}

.el-table__body-wrapper {
  scrollbar-width: thin;
  scrollbar-color: #e0e0e0 #f5f7fa;
}
</style>
