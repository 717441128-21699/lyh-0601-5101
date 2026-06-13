import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, CheckCircle2, AlertCircle, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/store'

const ACCEPTED_FORMATS = ['.pdf', '.doc', '.docx', '.jpg', '.png']
const MAX_SIZE = 20 * 1024 * 1024

interface UploadedFile {
  file: File
  name: string
  size: number
  valid: boolean
  error?: string
}

export default function ContractUpload() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [requirementId, setRequirementId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [amount, setAmount] = useState('')
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [newContractId, setNewContractId] = useState('')
  const [error, setError] = useState('')

  const validateFile = (file: File): UploadedFile => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_FORMATS.includes(ext)) {
      return { file, name: file.name, size: file.size, valid: false, error: '不支持的文件格式' }
    }
    if (file.size > MAX_SIZE) {
      return { file, name: file.name, size: file.size, valid: false, error: '文件超过20MB限制' }
    }
    return { file, name: file.name, size: file.size, valid: true }
  }

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const newFiles = Array.from(fileList).map(validateFile)
    setFiles((prev) => [...prev, ...newFiles])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [])

  const handleSubmit = async () => {
    if (files.length === 0 || files.some((f) => !f.valid)) return
    if (!supplierName.trim() || !amount) return
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', files[0].file)
      fd.append('requirementId', requirementId)
      fd.append('supplierName', supplierName)
      fd.append('amount', amount)
      const result = await apiFetch<{ id: string }>('/contracts/upload', {
        method: 'POST',
        body: fd,
      })
      setNewContractId(result.id || '')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">上传成功</h2>
        <p className="text-sm text-gray-500 mb-6">线下合同已成功上传，系统将自动进行合规校验</p>
        <div className="flex items-center gap-3">
          {newContractId && (
            <button
              onClick={() => navigate(`/contracts/${newContractId}`)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              查看合同
            </button>
          )}
          <button onClick={() => navigate('/contracts')} className="btn-secondary">
            返回合同列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">上传线下合同</h2>

      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">关联需求</label>
        <input
          value={requirementId}
          onChange={(e) => setRequirementId(e.target.value)}
          placeholder="请输入关联需求编号，如 XQ-2024-001"
          className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">供应商名称 <span className="text-coral-400">*</span></label>
          <input
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="请输入供应商名称"
            className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">合同金额(元) <span className="text-coral-400">*</span></label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="请输入合同金额"
            className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
      </div>

      <div className="card">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-10 text-center transition-colors',
            dragging ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
          )}
        >
          <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">拖拽文件到此处，或<span className="text-primary-500 cursor-pointer"> 点击上传</span></p>
          <p className="text-xs text-gray-400 mt-2">支持 {ACCEPTED_FORMATS.join(', ')} 格式，单文件不超过20MB</p>
          <input
            type="file"
            multiple
            accept={ACCEPTED_FORMATS.join(',')}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="btn-secondary mt-4 cursor-pointer inline-flex">
            选择文件
          </label>
        </div>
      </div>

      {files.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-3">文件列表</h3>
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-gray-50">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900 flex-1 truncate">{f.name}</span>
                <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)}KB</span>
                {f.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-coral-400" />
                    <span className="text-xs text-coral-400">{f.error}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-coral-50 text-coral-500 text-sm rounded-lg border border-coral-100">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={files.length === 0 || files.some((f) => !f.valid) || uploading || !supplierName.trim() || !amount}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? '上传中...' : '提交上传'}
      </button>
    </div>
  )
}
