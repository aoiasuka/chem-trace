"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import * as THREE from "three";
import gsap from "gsap";
import Link from "next/link";

export default function DashboardClient({ data }: { data: any }) {
  const invChartRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);
  const catChartRef = useRef<HTMLDivElement>(null);
  const warnChartRef = useRef<HTMLDivElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // --- ECharts Initialization ---
    const chartOpts = {
      textColor: "#9ca3af",
      splitLineColor: "#374151",
    };

    let invChart: echarts.ECharts | undefined;
    let trendChart: echarts.ECharts | undefined;
    let catChart: echarts.ECharts | undefined;
    let warnChart: echarts.ECharts | undefined;

    if (invChartRef.current) {
      invChart = echarts.init(invChartRef.current);
      // Top 6 chemicals for inventory chart
      const topChems = [...data.chemList]
        .sort((a: any, b: any) => b.currentQuantity - a.currentQuantity)
        .slice(0, 8);
      invChart.setOption({
        tooltip: {
          trigger: "axis",
          backgroundColor: "#111827",
          borderColor: "#374151",
          textStyle: { color: "#fff" },
        },
        grid: { left: "3%", right: "4%", bottom: "3%", top: "10%", containLabel: true },
        xAxis: {
          type: "value",
          splitLine: { lineStyle: { color: chartOpts.splitLineColor, type: "dashed" } },
          axisLabel: { color: chartOpts.textColor },
        },
        yAxis: {
          type: "category",
          data: topChems.map((c) => c.name),
          axisLabel: { color: chartOpts.textColor },
        },
        series: [
          {
            type: "bar",
            barWidth: "40%",
            itemStyle: { color: "#3b82f6" },
            data: topChems.map((c) => ({
              value: c.currentQuantity,
              itemStyle: {
                color:
                  c.level === "normal"
                    ? "#10b981"
                    : c.level === "critical"
                    ? "#ef4444"
                    : "#f59e0b",
              },
            })),
          },
        ],
      });
    }

    if (trendChartRef.current) {
      trendChart = echarts.init(trendChartRef.current);
      trendChart.setOption({
        tooltip: {
          trigger: "axis",
          backgroundColor: "#111827",
          borderColor: "#374151",
          textStyle: { color: "#fff" },
        },
        legend: { data: ["入库", "领用", "废弃"], textStyle: { color: chartOpts.textColor }, top: 0, right: 0 },
        grid: { left: "3%", right: "4%", bottom: "5%", top: "15%", containLabel: true },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: data.days.map((d: any) => d.label),
          axisLabel: { color: chartOpts.textColor },
        },
        yAxis: {
          type: "value",
          splitLine: { lineStyle: { color: chartOpts.splitLineColor, type: "dashed" } },
          axisLabel: { color: chartOpts.textColor },
        },
        series: [
          {
            name: "入库",
            type: "line",
            step: "middle",
            lineStyle: { width: 2, color: "#10b981" },
            itemStyle: { color: "#10b981" },
            data: data.days.map((d: any) => d.stockIn),
          },
          {
            name: "领用",
            type: "line",
            step: "middle",
            lineStyle: { width: 2, color: "#3b82f6" },
            itemStyle: { color: "#3b82f6" },
            data: data.days.map((d: any) => d.borrow),
          },
          {
            name: "废弃",
            type: "line",
            step: "middle",
            lineStyle: { width: 2, color: "#f59e0b" },
            itemStyle: { color: "#f59e0b" },
            data: data.days.map((d: any) => d.dispose),
          },
        ],
      });
    }

    if (catChartRef.current) {
      catChart = echarts.init(catChartRef.current);
      catChart.setOption({
        tooltip: {
          trigger: "item",
          backgroundColor: "#111827",
          borderColor: "#374151",
          textStyle: { color: "#fff" },
        },
        series: [
          {
            type: "pie",
            radius: ["40%", "70%"],
            center: ["50%", "55%"],
            itemStyle: { borderColor: "#111827", borderWidth: 2 },
            label: { show: false },
            data: data.byCategory.map(([name, value]: any) => ({
              value,
              name,
            })),
          },
        ],
      });
    }

    if (warnChartRef.current) {
      warnChart = echarts.init(warnChartRef.current);
      const warnData = [
        { value: data.levelCount.critical, name: "严重不足", itemStyle: { color: "#ef4444" } },
        { value: data.levelCount.below, name: "低于阈值", itemStyle: { color: "#f97316" } },
        { value: data.levelCount.low, name: "偏低", itemStyle: { color: "#f59e0b" } },
        { value: data.levelCount.normal, name: "充足", itemStyle: { color: "#10b981" } },
      ].filter((d) => d.value > 0);

      warnChart.setOption({
        tooltip: {
          trigger: "item",
          backgroundColor: "#111827",
          borderColor: "#374151",
          textStyle: { color: "#fff" },
        },
        series: [
          {
            type: "pie",
            radius: "70%",
            center: ["50%", "55%"],
            itemStyle: { borderColor: "#111827", borderWidth: 2 },
            label: { show: false },
            data: warnData,
          },
        ],
      });
    }

    const handleResize = () => {
      invChart?.resize();
      trendChart?.resize();
      catChart?.resize();
      warnChart?.resize();
    };
    window.addEventListener("resize", handleResize);

    // --- Three.js Background Animation ---
    let reqId: number;
    let renderer: THREE.WebGLRenderer | undefined;
    let handleThreeResize: (() => void) | undefined;
    
    if (threeCanvasRef.current) {
      const canvas = threeCanvasRef.current;
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0b111e, 0.015);

      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 30;
      camera.position.y = 10;

      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
      });
      renderer.setClearColor(0x0b111e, 1);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      const gridHelper = new THREE.GridHelper(200, 40, 0x3b82f6, 0x1f2937);
      gridHelper.position.y = -10;
      scene.add(gridHelper);

      const geometry = new THREE.BufferGeometry();
      const particlesCount = 800;
      const posArray = new Float32Array(particlesCount * 3);
      for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 120;
      }
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(posArray, 3)
      );
      const material = new THREE.PointsMaterial({
        size: 0.4,
        color: 0x10b981,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      });
      const particlesMesh = new THREE.Points(geometry, material);
      scene.add(particlesMesh);

      const clock = new THREE.Clock();
      function animate() {
        reqId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.02;
        gridHelper.position.z = (elapsedTime * 10) % 5;

        renderer?.render(scene, camera);
      }
      animate();

      handleThreeResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer?.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", handleThreeResize);
    }

    // --- GSAP Animations ---
    const ctx = gsap.context(() => {
      gsap.from(".panel", {
        duration: 1,
        y: 30,
        opacity: 0,
        stagger: 0.05,
        ease: "power3.out",
        delay: 0.2,
      });

      gsap.from("header", {
        duration: 1,
        y: -20,
        opacity: 0,
        ease: "power3.out",
      });

      const statNumbers = document.querySelectorAll(
        ".num-font.text-6xl, .num-font.text-7xl"
      );
      statNumbers.forEach((el) => {
        const element = el as HTMLElement;
        const finalVal = parseInt(element.innerText.replace(/,/g, ""));
        if (isNaN(finalVal)) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: finalVal,
          duration: 2,
          ease: "power2.out",
          delay: 0.5,
          onUpdate: () => {
            let text = Math.floor(obj.val).toString();
            if (element.innerText.startsWith("0") && text.length < 2) {
              text = text.padStart(2, "0");
            }
            element.innerText = text;
          },
        });
      });
    });

    // Clock
    const clockEl = document.getElementById("clock");
    const timer = setInterval(() => {
      if (!clockEl) return;
      const d = new Date();
      const pad = (n: number) => (n < 10 ? "0" + n : n);
      clockEl.innerText = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(
        d.getDate()
      )} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }, 1000);

    return () => {
      window.removeEventListener("resize", handleResize);
      invChart?.dispose();
      trendChart?.dispose();
      catChart?.dispose();
      warnChart?.dispose();
      
      if (reqId) cancelAnimationFrame(reqId);
      if (threeCanvasRef.current) {
        window.removeEventListener("resize", handleThreeResize);
        renderer?.dispose();
      }
      
      ctx.revert(); // Revert GSAP animations to fix Strict Mode double-fire
      clearInterval(timer);
    };
  }, [data]);

  return (
    <div className="h-screen w-screen p-4 flex flex-col font-['Noto_Sans_SC',sans-serif] bg-transparent text-[#d1d5db] overflow-hidden relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;600&family=Noto+Sans+SC:wght@400;500;700&display=swap');
        .num-font { font-family: 'Teko', sans-serif; }
        .panel {
            background-color: rgba(17, 24, 39, 0.85);
            backdrop-filter: blur(4px);
            border: 1px solid #374151;
            position: relative;
        }
        .panel-header {
            background: linear-gradient(90deg, rgba(31, 41, 55, 0.8) 0%, transparent 100%);
            border-bottom: 1px solid #374151;
            padding: 8px 16px;
            font-size: 0.875rem;
            font-weight: 700;
            color: #9ca3af;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .panel::before {
            content: '';
            position: absolute;
            top: -1px; right: -1px;
            border-style: solid;
            border-width: 0 15px 15px 0;
            border-color: transparent #0b111e transparent transparent;
        }
        .accent-bar {
            width: 4px;
            height: 100%;
            position: absolute;
            left: 0;
            top: 0;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}} />
      <canvas
        id="three-canvas"
        ref={threeCanvasRef}
        className="absolute top-0 left-0 w-full h-full z-[-1] pointer-events-none"
      ></canvas>
      
      {/* Header */}
      <header className="flex justify-between items-end mb-4 pb-2 border-b-2 border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 w-10 h-10 flex items-center justify-center transform -skew-x-12">
            <svg
              className="w-6 h-6 text-black transform skew-x-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              ></path>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-widest flex items-center gap-4">
              CHEM-TRACE // COMMAND CENTER
              <Link href="/" className="text-sm font-sans tracking-normal bg-blue-600/20 text-blue-400 border border-blue-500/50 px-3 py-1 rounded hover:bg-blue-600/40 transition-colors">
                返回首页
              </Link>
            </h1>
            <p className="text-gray-400 text-xs tracking-wider mt-1">
              高校实验室危化品全流程追溯系统 - 控制台
            </p>
          </div>
        </div>
        <div className="flex gap-8">
          <div className="text-right">
            <div className="text-gray-500 text-xs">STATUS</div>
            <div className="text-green-500 font-bold tracking-widest">
              SECURE
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 text-xs">LOCAL TIME</div>
            <div
              className="num-font text-2xl text-white leading-none"
              id="clock"
            >
              2026.07.02 17:17:29
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Top Stats Row */}
        <div className="grid grid-cols-4 gap-4 h-28 shrink-0">
          <div className="panel flex items-center justify-between p-6">
            <div className="accent-bar bg-blue-500"></div>
            <div>
              <div className="text-gray-400 text-sm tracking-widest uppercase mb-1">
                总危化品数量
              </div>
              <div className="text-xs text-gray-500">
                覆盖 {data.byCategory.length} 大类别
              </div>
            </div>
            <div className="num-font text-6xl text-white leading-none">
              {data.totalChemicals}
            </div>
          </div>
          <div className="panel flex items-center justify-between p-6">
            <div className="accent-bar bg-orange-500"></div>
            <div>
              <div className="text-gray-400 text-sm tracking-widest uppercase mb-1">
                库存预警状态
              </div>
              <div className="text-xs text-orange-500/80">
                {data.criticalCount} 种属于严重不足 (CRITICAL)
              </div>
            </div>
            <div className="num-font text-6xl text-orange-500 leading-none">
              {data.warnCount}
            </div>
          </div>
          <div className="panel flex items-center justify-between p-6">
            <div className="accent-bar bg-green-500"></div>
            <div>
              <div className="text-gray-400 text-sm tracking-widest uppercase mb-1">
                今日入库流量
              </div>
              <div className="text-xs text-gray-500">
                共 {data.todayStockInCount} 笔入库
              </div>
            </div>
            <div className="num-font text-6xl text-green-500 leading-none">
              {data.todayStockInQty}
            </div>
          </div>
          <div className="panel flex items-center justify-between p-6">
            <div className="accent-bar bg-purple-500"></div>
            <div>
              <div className="text-gray-400 text-sm tracking-widest uppercase mb-1">
                今日操作总数
              </div>
              <div className="text-xs text-gray-500">领用 / 归还 / 废弃</div>
            </div>
            <div className="num-font text-6xl text-purple-500 leading-none">
              {data.todayOpsCount}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          {/* Left Column: Big Charts */}
          <div className="col-span-8 flex flex-col gap-4 min-h-0">
            <div className="panel flex-[3] flex flex-col min-h-0 relative group">
              <div className="panel-header flex justify-between items-center">
                <span>当前库存水位分析 (INVENTORY LEVELS)</span>
                <svg
                  className="w-4 h-4 text-gray-600 group-hover:text-blue-500 transition-colors cursor-pointer"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  ></path>
                </svg>
              </div>
              <div ref={invChartRef} className="flex-1 w-full min-h-0 p-2"></div>
            </div>

            <div className="panel flex-[2] flex flex-col min-h-0">
              <div className="panel-header">7日操作趋势 (7-DAY TREND)</div>
              <div ref={trendChartRef} className="flex-1 w-full min-h-0 p-2"></div>
            </div>
          </div>

          {/* Right Column: Pies & Logs */}
          <div className="col-span-4 flex flex-col gap-4 min-h-0">
            {/* Two Pies Side by Side */}
            <div className="flex gap-4 h-[220px] shrink-0">
              <div className="panel flex-1 flex flex-col min-h-0 min-w-0">
                <div className="panel-header text-xs truncate">
                  类别分布 (CATEGORY)
                </div>
                <div ref={catChartRef} className="flex-1 w-full min-h-0"></div>
              </div>
              <div className="panel flex-1 flex flex-col min-h-0 min-w-0">
                <div className="panel-header text-xs truncate">
                  预警比例 (WARNING)
                </div>
                <div ref={warnChartRef} className="flex-1 w-full min-h-0"></div>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="panel flex-1 flex flex-col min-h-0 relative">
              <div className="panel-header flex justify-between items-center bg-[#1f2937]">
                <span>实时审计流 (AUDIT LOGS)</span>
                <span className="text-green-500 text-[10px] animate-pulse border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded-sm">
                  ● LIVE
                </span>
              </div>
              <div className="flex-1 p-0 overflow-hidden relative bg-[#0b111e]/50">
                <div className="absolute inset-0 overflow-y-auto p-4 text-xs font-mono custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700/50 text-gray-500 sticky top-0 bg-[#0b111e] z-10">
                        <th className="py-2 pb-3 font-normal">TIME</th>
                        <th className="py-2 pb-3 font-normal">OP</th>
                        <th className="py-2 pb-3 font-normal">USER</th>
                        <th className="py-2 pb-3 text-right font-normal">
                          STATUS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentAudits.map((log: any) => (
                        <tr
                          key={log.id}
                          className="border-b border-gray-800/60 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3 text-gray-400">
                            {new Date(log.opTime).toLocaleTimeString("zh-CN", {
                              hour12: false,
                            })}
                          </td>
                          <td className="py-3 text-blue-400">{log.opType}</td>
                          <td className="py-3 text-gray-300">{log.operator}</td>
                          <td className="py-3 text-right">
                            {log.status === "SUCCESS" ? (
                              <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-sm">
                                SUCCESS
                              </span>
                            ) : log.status === "DENIED" ? (
                              <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-sm">
                                DENIED
                              </span>
                            ) : (
                              <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-sm">
                                WARNING
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Bottom Gradient for Fade effect */}
                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#111827] to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
