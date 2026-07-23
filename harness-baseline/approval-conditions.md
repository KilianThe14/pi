# B0 批准条件（Mock 完整版）

版本：`approval-conditions.v1`
Mock：`true`
状态：`mock_frozen_candidate`
Owner：`freeze-governance-owner`

本文件把“材料齐全”和“实验已通过”分开。当前 Schema、任务、Fixture、Judge 样例和报告均为用户授权生成的 Mock 材料，可用于实现与联调；除非有实际运行日志、哈希、人工签署和远端回读证据，否则不得据此声称 CAL、Judge readiness、B0 冻结或诊断已完成。

## 1. 权威与冲突处理

- Baseline PRD：`LexWd2oGjoqpU2xOVRbcXL7Lnre`，本次读取 revision 83。
- 上位 PRD：`IH0AdLTo6o2RrzxjGqtcT8ZInad`，当前同步并回读 revision 290。
- 两者冲突时以 Baseline revision 83 为准。上位 PRD 中仍出现的 `12/24/40`、Q33/Q36/Q40/Q41/Q45/Q48/Q52/Q53 待定表述必须替换为 Baseline 最终值。
- 远端上位 PRD 完成写入后，必须重新读取目录、冲突章节和文档尾部；只有读回内容一致且 revision 已更新，`decision_resolution_matrix` 才能从 `pending_live_readback` 改为 `synced_and_readback_verified`。

## 2. 角色隔离

| 角色 | 可以做 | 不可以做 |
|---|---|---|
| 实现者 | 生成候选、修复代码、提交证据 | 批准自己的资格或冻结 |
| 用户范围负责人 | 确认目标、边界、Mock 使用和风险 | 代替技术审查 |
| 数据与 Fixture 审查者 | 核对确定性、一致性、隔离和隐藏字段 | 修改已密封结果后继续沿用旧 hash |
| Judge 审查者 | 复核 Prompt、匿名投影、rubric、readiness 结果 | 查看版本身份或另一 Judge 分数 |
| 独立技术审查者 | 验证非弱化、无 Harness 注入、运行隔离、证据完整性 | 是本候选的主要实现者 |
| 冻结批准人 | 在全部门禁通过后执行 `freeze_review → frozen` | 跳过任何门禁或接受口头结论 |

冻结批准人可以与用户范围负责人是同一人，但不能与主要实现者或独立技术审查者是同一人。所有批准记录必须包含角色、姓名或稳定标识、时间、决议、证据引用和被批准的 hash。

## 3. 门禁

### G0 规格同步

通过条件：

1. `decision_resolution_matrix` 九项解析均为最终值。
2. 上位 PRD 已覆盖 Baseline 冲突，远端回读状态为 `synced_and_readback_verified`。
3. 32/48/64 仅作为异常熔断；Prompt 不显示正常预算或剩余量。
4. `formal_run`、`dev_run` 禁用 Pi read/write/edit/bash；只有隔离的 `engineering_debug` 可开放。
5. replay、超时、上下文、replacement、Prompt、Pi 来源、AgentTaskView 和 final_output 口径一致。

任一项缺失：`REWORK`，状态保持 `spec_sync_blocked`。

### G1 Pi 来源与能力

通过条件：

1. 优先选择稳定 release tag，并记录上游仓库、release、`upstream_commit`、Fork commit 和 SDK hash。
2. 若使用 main commit，必须有稳定 release 缺少所需 SDK/Hook 的证据及 `engineering_debug` 兼容性记录。
3. 能力记录至少验证：SDK session、原生多轮 tool calling、每响应一个 action、`parallel_tool_calls=false`、工具白名单、主动 final、禁工具 repair、usage 原始字段存在性、上下文窗口来源和中性生命周期 Hook。
4. Fork 仓库中的来源记录与实验仓库引用的 commit 完全一致。

来源、commit 或能力证据缺失：`BLOCKED`；能力不满足但可修复：`REWORK`。

### G2 机器契约

通过条件：

1. 所有 JSON Schema 为 Draft 2020-12，默认 `additionalProperties=false`。
2. `final_output.v1`、AgentTaskView、ToolEnvelope、run_event_trace、各 manifest、Judge、run index、failure record 和 integrity report Schema 可解析。
3. 26 接口精确为 24 个业务工具、Agent 可调用 `get_tool_detail`、Runner 内部 `list_tools`；每个接口均有输入/输出 Schema、限制和失败模式。
4. `run_policy.v1` 与 Baseline 数值完全一致。
5. hash 清单覆盖所有冻结依赖；重新计算无差异。
6. `node scripts/validate-artifacts.mjs` 返回零退出码。

任何 Schema、计数、交叉规则或 hash 失败：`REWORK`。

### G3 数据与隔离

通过条件：

1. CAL 8 条、诊断 35 条、冻结留出测试 15 条、Judge readiness 12 条。
2. 每条任务 3 个计划槽位，分别为 24、105、45。
3. CAL/诊断/留出三集合的 CardKey、fixture_id、evidence namespace 和 failure-state namespace 两两零交集。
4. 诊断分布为焦点 14/11/10、状态 22/7/6、难度 10/14/11、挑战 25/10。
5. 留出分布为焦点 6/4/5、状态 10/3/2、难度 5/6/4、挑战 10/5。
6. 共享 Mock world 明确 raw/PSA10、成交、挂牌、趋势、Pop、球员和十类混淆工具的确定性派生规则。
7. 五类 `result_status` 和 temporary/persistent/parameter 三类故障路径均有可执行样例。
8. 隐藏字段只出现在任务治理域，不进入 `agent_visible` 或 Judge 匿名输入。

任一隔离或隐藏字段检查失败：`BLOCKED`，修复并重新生成全部受影响 hash。

### G4 B0 资格

自动检查与独立人工审查均须通过：

1. B0 Prompt 与冻结文本逐字一致，完全替换 Pi Coding Prompt，自动 Context Files 关闭。
2. `enabled_interventions=[]`，无七层状态机、固定业务流、推荐工具、证据组合表、Verification 或 Stop 表注入。
3. B0 同时具备正常原生 tool calling、按需详情、主动 final、条件化、请求补充和停止能力，未被故意弱化。
4. Provider messages 只能由运行时 `AgentTaskView` 新对象序列化。
5. fresh Session、计数器、工具状态、故障状态和文件状态隔离测试通过。
6. 所有强制检查都有原始证据；不存在 blocker 或 major。

缺证据或存在 blocker/major：`REWORK`，不得启动 CAL。

### G5 Judge readiness

Mock readiness 材料本身不能通过本门禁。实际执行必须满足：

1. Process/Result Judge 对 12 个样例各独立运行 3 次。
2. 输出 Schema 合规率和引用解析率均为 100%。
3. 六个硬约束子类型检出率 100%，两个正常对照误报数为 0。
4. 至少 80% 的维度中位分落在人工参考区间中心值 ±1.0。
5. 至少 90% 的“样例 × 维度”三次评分极差 ≤1.0。
6. 匿名检查确认版本、Prompt、Harness artifact、split、隐藏推理和另一 Judge 分数均不存在。
7. 业务审查者与评测审查者共同签署实际报告。

任一项失败：状态 `judge_readiness_failed`，创建新 Judge 配置版本并完整重跑 12×2×3，不得删样例或修改参考区间。

### G6 CAL

实际 24 个计划有效 run 必须满足：

1. API 有效响应率 ≥95%。
2. 明确需要取证的有效 run 中，业务取证调用率 ≥90%。
3. 所有调用工具的有效 run 完成 Provider → Tool → Provider 闭环。
4. 工具 JSON 可解析率 ≥95%。
5. final 合规率 ≥95%。
6. 无确认的现实知识覆盖 Mock、无跨 run 串线。
7. 资格审查为 PASS。
8. Provider 原请求重试最多 2 次；原 run replacement 最多 2 个；CAL 阶段 replacement 总数最多 3。

实际运行未完成：`NOT_RUN`；门槛失败：`cal_failed`；达到补跑上限：`infrastructure_incomplete`。

### G7 冻结

只有同时满足以下条件，冻结批准人才可以转为 `frozen`：

1. G0—G6 全部通过。
2. 用户范围负责人确认实验边界和风险。
3. 独立技术审查者确认实现、证据、无 Harness 注入和无故意弱化。
4. 数据、工具、Prompt、模型、Runner、run policy、Schema、Judge 与 CAL hash 在批准时仍与证据包一致。
5. 实现者、独立技术审查者和冻结批准人的职责隔离成立。
6. 状态转换记录包含变更前后状态、操作者、时间、原因和证据。

hash 在审批期间变化：全部受影响门禁重新执行。

### G8 正式诊断启动

1. 105 个计划位置已在 run index 中预登记。
2. formal 模式单并发、无人干预，测试集仓库未挂载。
3. 日志、raw refs、hash、Judge score refs 和 replacement 链能双向追溯。
4. 诊断只用于发现和归因，不作为冻结留出测试分数。

## 4. 决议语义

- `PASS`：全部强制项由可解析证据证明通过。
- `REWORK`：信息充分且存在可执行整改；修复后重新审查受影响门禁。
- `BLOCKED`：缺访问、凭证、权威来源、独立角色或无法安全取得的外部证据。
- `NOT_RUN`：Mock 材料齐全，但实际运行未发生；不能当作 PASS。

口头确认、文档描述、Mock 预期报告、代码评审或设计分数均不能替代实际 CAL、Judge readiness、正式诊断和冻结审批证据。
