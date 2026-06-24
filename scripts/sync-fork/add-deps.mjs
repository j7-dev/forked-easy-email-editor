// 注入 j7 fork 需要的 build devDependencies (sass / postcss 工具鏈)。
// 來源: j7/custom 相對 upstream 的真實 devDependencies 增量 (已用 prettier 正規化驗證)。
// 冪等: 重跑只會覆寫成相同版本。
import { readFileSync, writeFileSync } from 'node:fs';

const SETS = {
  'packages/easy-email-core/package.json': {
    'css-loader': '^7.1.2',
    sass: '^1.80.6',
    'sass-loader': '^16.0.3',
    'style-loader': '^4.0.0',
  },
  'packages/easy-email-editor/package.json': {
    'css-loader': '^7.1.2',
    'sass-loader': '^16.0.3',
    'style-loader': '^4.0.0',
  },
  'packages/easy-email-extensions/package.json': {
    autoprefixer: '^10.4.20',
    'css-loader': '^7.1.2',
    postcss: '^8.4.49',
    'postcss-import': '^16.1.0',
    'postcss-nesting': '^13.0.1',
    'sass-loader': '^16.0.3',
    'style-loader': '^4.0.0',
  },
};

for (const [file, deps] of Object.entries(SETS)) {
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`  ! 跳過 ${file} (讀不到，upstream 結構可能變了): ${e.message}`);
    continue;
  }
  pkg.devDependencies ||= {};
  for (const [name, ver] of Object.entries(deps)) pkg.devDependencies[name] = ver;
  // 排序讓 diff 穩定 (prettier 之後仍一致)
  pkg.devDependencies = Object.fromEntries(
    Object.entries(pkg.devDependencies).sort((a, b) => a[0].localeCompare(b[0])),
  );
  writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`  deps += [${Object.keys(deps).join(', ')}] -> ${file}`);
}
